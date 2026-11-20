import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parseStamps, answerMission } from '../public/missions.js';
const catalog = JSON.parse(await fs.readFile(new URL('../public/data/ambientes.json', import.meta.url), 'utf8'));
const ids = catalog.ambientes.map(r => r.id);

test('El pasaporte descarta datos corruptos, desconocidos y sellos duplicados', () => {
  assert.deepEqual([...parseStamps('{broken', ids)], []);
  assert.deepEqual([...parseStamps('{"id":"caballeros"}', ids)], []);
  assert.deepEqual([...parseStamps(JSON.stringify(['caballeros','caballeros','inventado',null,42]), ids)], ['caballeros']);
});

test('Solo la respuesta correcta gana un sello y repetir no aumenta el progreso', () => {
  let stamps = new Set();
  for (const room of catalog.ambientes) {
    for (const invalid of [-1,99,String(room.reto.correcta),NaN]) {
      const result = answerMission(stamps, room, invalid); assert.equal(result.correct, false); assert.deepEqual(result.stamps, stamps);
    }
    const wrong = answerMission(stamps, room, (room.reto.correcta+1)%3);
    assert.equal(wrong.awarded, false); assert.deepEqual(wrong.stamps, stamps);
    const won = answerMission(stamps, room, room.reto.correcta);
    assert.equal(won.correct, true); assert.equal(won.awarded, true); assert.equal(stamps.has(room.id), false);
    stamps = won.stamps;
    const repeat = answerMission(stamps, room, room.reto.correcta);
    assert.equal(repeat.correct, true); assert.equal(repeat.awarded, false); assert.equal(repeat.stamps.size, stamps.size);
  }
  assert.equal(stamps.size, 9);
  assert.deepEqual(parseStamps(JSON.stringify([...stamps]), ids), stamps);
});

test('Las nueve fichas identifican la ficción y ofrecen retos completos con opciones distintas', () => {
  for (const room of catalog.ambientes) {
    assert.equal(room.tipoContenido, 'demostracion');
    assert.match(room.estadoInformacion, /no son datos oficiales/);
    assert.match(room.narracion, /ejemplo ficticio, no información oficial/);
    assert.ok(room.descripcion.length > 220);
    assert.doesNotMatch(room.descripcion, /deben confirmarse con la facultad/);
    assert.equal(new Set(room.reto.opciones).size, 3);
    assert.ok(Number.isInteger(room.reto.correcta) && room.reto.correcta >= 0 && room.reto.correcta < 3);
    assert.ok(room.reto.pregunta.length > 20 && room.reto.explicacion.length > 20);
  }
});
