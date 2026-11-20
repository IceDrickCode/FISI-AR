import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { StablePose, TargetLock, sampleAfterTargetUpdate } from '../public/tracking.js';
import { placeBubble } from '../public/guide-math.js';

const pose = (x = 0, angle = 0, scale = 1) => new T.Matrix4().compose(new T.Vector3(x, 0, -3), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale));
function acquire(filter, start = 0, x = 0) {
  for (let t = start; t <= start + 200; t += 40) { filter.sample(pose(x), t); filter.tick(t); }
}

test('La pose nativa ya confirmada aparece sin espera adicional, incluso con render lento', () => {
  for (const fps of [1,5,15,30]) {
    const filter = new StablePose(T);
    assert.equal(filter.sample(pose(), 0), true); assert.equal(filter.tick(0), true);
    assert.equal(filter.sample(pose(0.01), 1000/fps), true);
    assert.equal(filter.tick(1000/fps), true, `${fps} FPS`);
  }
  const filter = new StablePose(T), invalid=pose();invalid.elements[0]=NaN;
  assert.equal(filter.sample(invalid,0),false);assert.equal(filter.tick(0),false);
  assert.equal(filter.sample(pose(.01),40),true);assert.equal(filter.tick(40),true);
});

test('El seguimiento recibe poses aunque no haya frames de renderizado y lee la matriz nueva', async () => {
  const raw={visible:false,matrix:pose()}, record={anchor:{object3D:raw},filter:new StablePose(T)};
  let readyCalls=0;
  sampleAfterTargetUpdate(record,()=>true,()=>0,()=>readyCalls++);
  raw.visible=true;raw.matrix=pose();await Promise.resolve();
  assert.equal(record.filter.history.length,1);assert.equal(record.filter.ready,true);assert.equal(readyCalls,1);
  sampleAfterTargetUpdate(record,()=>true,()=>40,()=>readyCalls++);
  raw.matrix=pose(.01);await Promise.resolve();
  assert.equal(record.filter.ready,true); // No render tick was needed to acquire.
  assert.equal(readyCalls,1);
  const count=record.filter.history.length;
  sampleAfterTargetUpdate(record,()=>true,()=>60);await Promise.resolve();
  assert.equal(record.filter.history.length,count); // Do not reuse an unchanged matrix.
  sampleAfterTargetUpdate(record,()=>false,()=>80);raw.matrix=pose(.02);await Promise.resolve();
  assert.equal(record.filter.history.length,count); // Closed session.
  sampleAfterTargetUpdate(record,()=>true,()=>100);raw.visible=false;await Promise.resolve();
  assert.equal(record.filter.history.length,count); // Lost target.
});

test('Filtra ruido y rechaza saltos de posición, giro y escala tras la confirmación nativa', () => {
  const filter = new StablePose(T);
  filter.sample(pose(), 0); assert.equal(filter.tick(0), true);
  assert.equal(filter.tick(200), true); // No extra rendering-frame acquisition gate.
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
  assert.equal(filter.sample(pose(2), 440), true); assert.equal(filter.tick(440), true);
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
