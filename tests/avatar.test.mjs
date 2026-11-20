import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildByteModel } from '../public/avatar.js';
test('Byte tiene geometría finita, animable y dentro del presupuesto móvil', () => {
  const model = buildByteModel(THREE);
  let triangles = 0;
  model.traverse(object => {
    if (!object.isMesh) return;
    const position = object.geometry.getAttribute('position');
    assert.ok([...position.array].every(Number.isFinite));
    triangles += (object.geometry.index?.count || position.count) / 3;
  });
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  assert.ok(size.x < 2 && size.y < 2.6 && size.z < 1.2);
  assert.ok(triangles < 15000, `Presupuesto excedido: ${triangles}`);
  for (const name of ['eyes','arm-right','arm-left','leg-right','leg-left','leaf-antenna']) assert.ok(model.getObjectByName(name), name);
  const clone = model.clone(true);
  assert.equal(clone.getObjectByName('helmet').geometry, model.getObjectByName('helmet').geometry);
});
