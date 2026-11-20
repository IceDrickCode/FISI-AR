import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { decode } from '@msgpack/msgpack';
import { initialState, transition } from '../public/state.js';
import { moveOffset, placeBubble } from '../public/guide-math.js';
test('No se reconoce sin sesión lista ni índice válido', () => {
  assert.equal(transition(initialState(), { type: 'found', index: 0 }).tracked, false);
  const starting = transition(initialState(), 'start');
  assert.equal(transition(starting, { type: 'found', index: 0 }).tracked, false);
  assert.equal(transition(transition(starting, 'ready'), { type: 'found', index: -1 }).tracked, false);
});
test('Cambio de ambiente ignora la pérdida tardía del anterior', () => {
  let s = ['start', 'ready', { type: 'found', index: 0 }, { type: 'found', index: 3 }].reduce(transition, initialState());
  s = transition(s, { type: 'lost', index: 0 });
  assert.equal(s.activeIndex, 3); assert.equal(s.tracked, true);
  s = transition(s, { type: 'lost', index: 3 }); assert.equal(s.tracked, false);
  s = transition(s, { type: 'found', index: 3 }); assert.equal(s.tracked, true);
});
test('Los eventos tardíos no reabren una sesión cerrada', () => {
  const s = ['start', 'ready', { type: 'found', index: 2 }, 'stop', { type: 'found', index: 2 }, 'ready'].reduce(transition, initialState());
  assert.deepEqual(s, initialState());
  assert.equal(transition(transition(s, 'error'), { type: 'found', index: 2 }).tracked, false);
});
test('Flechas con velocidad uniforme, oposición, límites y pausas de frames', () => {
  const start = { x: 0, y: 0 };
  const straight = moveOffset(start, new Set(['right']), 40);
  const diagonal = moveOffset(start, new Set(['right', 'up']), 40);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - straight.x) < 1e-8);
  assert.deepEqual(moveOffset(start, new Set(['left', 'right']), 40), start);
  assert.equal(moveOffset({ x: 1.4, y: 0 }, new Set(['right']), 40).x, 1.4);
  assert.equal(moveOffset(start, new Set(['right']), 5000).x, 0.0375);
});
test('Burbuja se mantiene dentro de pantalla y deja espacio a controles', () => {
  for (const x of [-100, 100, 1000]) for (const y of [-100, 200, 1500]) {
    const pos = placeBubble({ x, y, width: 220, height: 170, viewportWidth: 390, viewportHeight: 844 });
    assert.ok(pos.left >= 12 && pos.left + 220 <= 378);
    assert.ok(pos.top >= 90 && pos.top + 170 <= 666);
    assert.ok(pos.tail >= 18 && pos.tail <= 202);
  }
});
test('Cada entrada del catálogo coincide con su imagen y con el binario ordenado', async () => {
  const data = JSON.parse(await fs.readFile(new URL('../public/data/ambientes.json', import.meta.url), 'utf8'));
  const report = JSON.parse(await fs.readFile(new URL('../audit/catalog-compilation.json', import.meta.url), 'utf8'));
  const binary = await fs.readFile(new URL(`../public/${data.targetFile}`, import.meta.url));
  const target = decode(binary);
  assert.equal(target.v, 2); assert.equal(target.dataList.length, data.ambientes.length);
  assert.equal(new Set(data.ambientes.map(r => r.id)).size, data.ambientes.length);
  assert.equal(crypto.createHash('sha256').update(binary).digest('hex'), report.outputSha256);
  for (const [i, room] of data.ambientes.entries()) {
    assert.equal(room.targetIndex, i);
    assert.equal(target.dataList[i].targetImage.width, room.width);
    assert.equal(target.dataList[i].targetImage.height, room.height);
    assert.ok(target.dataList[i].trackingData[1].points.length >= 4, room.id);
    if (room.matchRegion) for (const frame of target.dataList[i].matchingData) {
      const [x0,y0,x1,y1] = room.matchRegion;
      for (const point of [...frame.maximaPoints,...frame.minimaPoints]) {
        assert.ok(point.x >= x0*frame.scale && point.x < x1*frame.scale && point.y >= y0*frame.scale && point.y < y1*frame.scale, `Rasgo fuera de la placa de nombre: ${room.id}`);
      }
    }
    const bytes = await fs.readFile(new URL(`../public/${room.imagenObjetivo}`, import.meta.url));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), report.targets[i].sourceSha256);
  }
});
