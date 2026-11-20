import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { StablePose, TargetLock } from '../public/tracking.js';
import { placeBubble } from '../public/guide-math.js';

const pose = (x = 0, angle = 0, scale = 1) => new T.Matrix4().compose(new T.Vector3(x, 0, -3), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale));
function acquire(filter, start = 0, x = 0) {
  for (let t = start; t <= start + 200; t += 40) { filter.sample(pose(x), t); filter.tick(t); }
}

test('Exige una secuencia sostenida; filtra ruido y rechaza saltos de posición, giro y escala', () => {
  const filter = new StablePose(T);
  filter.sample(pose(), 0); assert.equal(filter.tick(0), false);
  assert.equal(filter.tick(200), false); // A single observation cannot show the guide.
  acquire(filter, 240);
  const displayed = [];
  for (let t = 480; t < 2080; t += 40) {
    filter.sample(pose((t / 40) % 2 ? 0.025 : -0.025), t); assert.equal(filter.tick(t), true);
    displayed.push(filter.position.x);
  }
  const range = Math.max(...displayed) - Math.min(...displayed);
  assert.ok(range < 0.015, `Jitter after filtering: ${range}, input range 0.05`);
  const before = filter.position.x;
  assert.equal(filter.sample(pose(1.2), 2080), false);
  assert.equal(filter.sample(pose(0, Math.PI / 2), 2120), false);
  assert.equal(filter.sample(pose(0, 0, 2), 2160), false);
  assert.equal(filter.tick(2160), true);
  assert.ok(Math.abs(filter.position.x - before) < 0.015);
  assert.equal(filter.sample(pose(0.01), 2200), true);
});

test('Sigue un desplazamiento real gradual sin congelarse y conserva las flechas en coordenadas locales', () => {
  const filter = new StablePose(T); acquire(filter);
  for (let i = 1; i <= 30; i++) { const t = 200 + i * 40; filter.sample(pose(i * 0.02), t); filter.tick(t); }
  assert.ok(filter.position.x > 0.48 && filter.position.x < 0.6);
  const display = new T.Object3D(), actor = new T.Object3D(); display.matrixAutoUpdate = false; display.add(actor);
  actor.position.set(0.25, 0.1, 0); display.matrix.copy(filter.matrix); display.updateMatrixWorld(true);
  assert.equal(actor.position.x, 0.25); // Camera tracking never writes the user movement offset.
  assert.ok(Math.abs(actor.getWorldPosition(new T.Vector3()).x - (filter.position.x + 0.25)) < 1e-7);
});

test('Oculta tras pérdida prolongada y readquiere una pose nueva sin interpolar desde el letrero anterior', () => {
  const filter = new StablePose(T); acquire(filter);
  assert.equal(filter.tick(220, false), true); // brief loss
  assert.equal(filter.tick(340, false), true);
  assert.equal(filter.tick(420, false), false);
  assert.equal(filter.sample(pose(2), 440), true); assert.equal(filter.tick(440), false);
  acquire(filter, 480, 2);
  assert.equal(filter.tick(680), true); assert.equal(filter.position.x, 2);
  const invalid = pose(); invalid.elements[0] = NaN;
  assert.equal(filter.sample(invalid, 700), false);
});

test('No parpadea con inferencia lenta mientras MindAR conserva el objetivo visible', () => {
  const filter = new StablePose(T);
  for (const t of [0, 950, 1900, 2850]) { filter.sample(pose(), t); filter.tick(t, true); }
  assert.equal(filter.ready, true);
  for (let t = 2850; t < 3800; t += 16) assert.equal(filter.tick(t, true), true);
  filter.sample(pose(0.01), 3800); assert.equal(filter.tick(3800, true), true);
  assert.equal(filter.tick(6400, true), false); // stalled pipeline eventually expires
});

test('No alterna identidades cuando dos objetivos comparten un intervalo de visibilidad', () => {
  const lock = new TargetLock(); assert.equal(lock.select([1]), 1);
  assert.equal(lock.select([2, 1]), 1); assert.equal(lock.select([1, 2]), 1);
  assert.equal(lock.select([2]), 2); assert.equal(lock.select([]), null);
});

test('La burbuja no cambia de lado por ruido de dos píxeles y sigue dentro de la pantalla', () => {
  let side; const sides = [];
  for (const x of [175, 177, 175, 177, 176, 174]) {
    const box = placeBubble({ x, y: 320, width: 160, height: 180, viewportWidth: 400, viewportHeight: 844, previousSide: side });
    side = box.side; sides.push(side); assert.ok(box.left >= 12 && box.left + 160 <= 388);
  }
  assert.deepEqual([...new Set(sides)], ['right']);
});
