import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';
import { loadImage } from 'canvas';
import * as tf from '@tensorflow/tfjs';
import { build as buildClusters } from 'mind-ar/src/image-target/matching/hierarchical-clustering.js';

const root = new URL('../', import.meta.url);
const readJSON = async url => JSON.parse(await fs.readFile(url, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const catalog = await readJSON(new URL('public/data/ambientes.json', root));
await fs.mkdir(new URL('audit/compiled/', root), { recursive: true });
await tf.setBackend('cpu'); await tf.ready();
const merged = [], report = [];
for (const [index, room] of catalog.ambientes.entries()) {
  if (room.targetIndex !== index) throw new Error('Los índices del catálogo deben ser consecutivos y ordenados.');
  const bytes = await fs.readFile(new URL(`public/${room.imagenObjetivo}`, root));
  const sourceSha256 = hash(bytes);
  const trainingSignature = hash(JSON.stringify({ sourceSha256, matchRegion: room.matchRegion || null, ...(room.featureRegions ? { featureRegions: room.featureRegions } : {}), version: 1 }));
  const cache = new URL(`audit/compiled/${room.id}.mind`, root);
  const meta = new URL(`audit/compiled/${room.id}.json`, root);
  let compiled, reused = false, alreadyFiltered = false;
  try {
    const prior = await readJSON(meta), binary = await fs.readFile(cache);
    if (prior.trainingSignature === trainingSignature && prior.outputSha256 === hash(binary)) {
      compiled = new OfflineCompiler().importData(binary)[0]; reused = true; alreadyFiltered = true;
    }
  } catch { /* Cache missing or invalid. */ }
  if (!compiled && index === 0 && room.id === 'redes-telecomunicaciones-02') {
    try {
      const prior = await readJSON(new URL('audit/compilation.json', root));
      const binary = await fs.readFile(new URL('public/assets/redes-02.mind', root));
      if (prior.sourceSha256 === sourceSha256 && prior.outputSha256 === hash(binary)) {
        compiled = new OfflineCompiler().importData(binary)[0]; reused = true;
      }
    } catch { /* Compile if the initial target changed. */ }
  }
  const compiler = new OfflineCompiler();
  if (!compiled) {
    console.log(`Compilando ${index + 1}/${catalog.ambientes.length}: ${room.nombre}`);
    [compiled] = await compiler.compileImageTargets([await loadImage(bytes)], () => {});
  } else console.log(`Reutilizado: ${room.nombre}`);
  // Use unique name-plate features for detection; keep the full planar marker for tracking.
  // This avoids the repeated vertical LABORATORIO layout dominating classification.
  if ((room.matchRegion || room.featureRegions) && !alreadyFiltered) {
    const regions = room.featureRegions || [room.matchRegion];
    const inside = (point, scale) => regions.some(([x0, y0, x1, y1]) => point.x >= x0 * scale && point.x < x1 * scale && point.y >= y0 * scale && point.y < y1 * scale);
    for (const keyframe of compiled.matchingData) {
      keyframe.maximaPoints = keyframe.maximaPoints.filter(p => inside(p, keyframe.scale));
      keyframe.minimaPoints = keyframe.minimaPoints.filter(p => inside(p, keyframe.scale));
      keyframe.maximaPointsCluster = buildClusters({ points: keyframe.maximaPoints });
      keyframe.minimaPointsCluster = buildClusters({ points: keyframe.minimaPoints });
    }
    // Reflective metal can create features that move with the lighting. Use the
    // persistent printed text/pictogram for tracking as well as classification.
    if (room.featureRegions) for (const frame of compiled.trackingData) frame.points = frame.points.filter(p => inside(p, frame.scale));
  }
  compiler.data = [compiled];
  const binary = Buffer.from(compiler.exportData());
  await fs.writeFile(cache, binary);
  const metrics = {
    id: room.id, targetIndex: index, sourceSha256, trainingSignature, matchRegion: room.matchRegion || null, ...(room.featureRegions ? { featureRegions: room.featureRegions } : {}), outputSha256: hash(binary), reused,
    width: compiled.targetImage.width, height: compiled.targetImage.height,
    matchingPoints: compiled.matchingData.map(s => s.maximaPoints.length + s.minimaPoints.length),
    trackingPoints: compiled.trackingData.map(s => s.points.length),
    runtimeTrackingPoints: compiled.trackingData[1]?.points.length || 0
  };
  await fs.writeFile(meta, JSON.stringify(metrics, null, 2));
  report.push(metrics); merged.push(compiled);
}
const compiler = new OfflineCompiler(); compiler.data = merged;
const buffer = Buffer.from(compiler.exportData());
const result = { mindarVersion: '1.2.5', targets: report, outputSha256: hash(buffer), bytes: buffer.length,
  validation: 'Technical feature extraction only. Physical validation remains pending.' };
await fs.writeFile(new URL('audit/catalog-compilation.json', root), JSON.stringify(result, null, 2));
const weak = report.filter(r => r.runtimeTrackingPoints < 4 || Math.max(...r.matchingPoints) < 12);
if (weak.length) throw new Error(`Objetivos insuficientes: ${weak.map(r => r.id).join(', ')}. Revisar el informe antes de habilitarlos.`);
await fs.writeFile(new URL(`public/${catalog.targetFile}`, root), buffer);
console.log(`Catálogo generado: ${report.length} objetivos, ${buffer.length} bytes.`);
