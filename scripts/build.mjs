import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode } from '@msgpack/msgpack';
const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(root, 'public');
await fs.mkdir(path.join(publicDir, 'vendor'), { recursive: true });
await fs.copyFile(path.join(root, 'node_modules/mind-ar/dist/mindar-image-aframe.prod.js'), path.join(publicDir, 'vendor/mindar-image-aframe-1.2.5.prod.js'));
const catalog = JSON.parse(await fs.readFile(path.join(publicDir, 'data/ambientes.json'), 'utf8'));
const target = decode(await fs.readFile(path.join(publicDir, catalog.targetFile)));
if (target.dataList?.length !== catalog.ambientes.length) throw new Error('El .mind y el catálogo deben contener el mismo número de objetivos.');
for (const [index, room] of catalog.ambientes.entries()) {
  if (room.targetIndex !== index || target.dataList[index].targetImage.width !== room.width || target.dataList[index].targetImage.height !== room.height) throw new Error(`Objetivo desalineado: ${room.id}`);
}
for (const name of ['index.html', 'app.js', 'state.js', 'guide-math.js', 'avatar.js', 'styles.css', 'vendor/aframe-1.5.0.min.js']) {
  if ((await fs.stat(path.join(publicDir, name))).size === 0) throw new Error(`Archivo vacío: ${name}`);
}
// Copy over the known output directory; no recursive deletion or original-resource mutation.
await fs.cp(publicDir, path.join(root, 'dist'), { recursive: true });
console.log(`Build correcto: dist/ contiene ${catalog.ambientes.length} objetivos MindAR.`);
