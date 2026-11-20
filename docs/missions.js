export function parseStamps(raw, ids) {
  try {
    const saved = JSON.parse(raw);
    return new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string' && ids.includes(id)) : []);
  } catch { return new Set(); }
}

export function answerMission(stamps, room, choice) {
  const correct = Number.isInteger(choice) && choice >= 0 && choice < room.reto.opciones.length && choice === room.reto.correcta;
  const awarded = correct && !stamps.has(room.id);
  const next = new Set(stamps);
  if (awarded) next.add(room.id);
  return { correct, awarded, stamps: next };
}

export function createMissions(rooms, { canAnswer, onEarn }) {
  const $ = id => document.getElementById(id), key = 'fisi-ar-passport-v1';
  let stamps = new Set(), persistent = true, current = null;
  try { stamps = parseStamps(localStorage.getItem(key), rooms.map(r => r.id)); }
  catch { persistent = false; }
  function renderPassport() {
    for (const label of document.querySelectorAll('[data-passport-count]')) label.textContent = `${stamps.size}/${rooms.length} sellos`;
    $('passport-list').replaceChildren();
    for (const room of rooms) {
      const earned = stamps.has(room.id), li = document.createElement('li');
      li.className = earned ? 'stamp earned' : 'stamp';
      const icon = document.createElement('span'); icon.className = 'stamp-icon'; icon.textContent = earned ? '✓' : '◇'; icon.setAttribute('aria-hidden', 'true');
      const text = document.createElement('div'), title = document.createElement('strong'), status = document.createElement('span');
      title.textContent = room.nombre; status.textContent = earned ? 'Sello obtenido' : 'Escanea y resuelve su reto';
      text.append(title, status); li.append(icon, text); $('passport-list').append(li);
    }
    document.querySelectorAll('.catalog-stamp').forEach(label => {
      label.textContent = stamps.has(label.dataset.roomId) ? '✓ Sello obtenido' : '◇ Reto disponible';
    });
    $('passport-storage').textContent = persistent ? 'Los sellos se guardan solo en este navegador.' : 'Almacenamiento no disponible: los sellos duran esta sesión.';
  }
  for (const button of document.querySelectorAll('[data-open-passport]')) button.onclick = () => $('passport-dialog').showModal();
  $('close-passport').onclick = () => $('passport-dialog').close();
  // Native details remain inside the same bounded scroll region as the description.
  for (const details of [$('room-details'), $('byte-challenge')]) details.addEventListener('toggle', () => {
    if (!details.open || $('bubble').hidden) return;
    requestAnimationFrame(() => {
      const region = document.querySelector('.bubble-content');
      region.scrollTop += details.getBoundingClientRect().top - region.getBoundingClientRect().top;
    });
  });
  function showRoom(room) {
    current = room;
    $('mission-answers').replaceChildren(); $('mission-result').textContent = '';
    $('byte-challenge').open = false;
    if (!room) return;
    $('mission-question').textContent = room.reto.pregunta;
    const already = stamps.has(room.id);
    if (already) $('mission-result').textContent = `✓ Ya tienes este sello. ${room.reto.explicacion}`;
    room.reto.opciones.forEach((option, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = option; button.disabled = already;
      button.onclick = () => {
        if (current !== room || !canAnswer(room)) return;
        const result = answerMission(stamps, room, index);
        for (const child of $('mission-answers').children) child.classList.remove('answer-wrong');
        if (!result.correct) {
          button.classList.add('answer-wrong');
          $('mission-result').textContent = 'Aún no. Revisa la ficha de ejemplo y vuelve a intentarlo.';
        } else {
          stamps = result.stamps;
          try { localStorage.setItem(key, JSON.stringify([...stamps])); } catch { persistent = false; }
          for (const child of $('mission-answers').children) child.disabled = true;
          button.classList.add('answer-correct');
          $('mission-result').textContent = `✓ ¡Sello conseguido! ${room.reto.explicacion}`;
          renderPassport();
          if (result.awarded) onEarn(room, stamps.size);
        }
        $('mission-result').scrollIntoView({ block: 'nearest' });
      };
      $('mission-answers').append(button);
    });
    document.querySelector('.bubble-content').scrollTop = 0;
  }
  renderPassport();
  return { showRoom };
}
