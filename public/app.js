import { initialState, transition } from './state.js';
import { moveOffset, placeBubble } from './guide-math.js';
import { avatarMarkup } from './avatar.js';

const $ = id => document.getElementById(id);
const keyboard = new Set(), pointers = new Map(), actors = new Map(), offsets = new Map();
const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let state = initialState(), catalog, scene, arSystem, utterance, terminated = false;
let point;
const debug = new URLSearchParams(location.search).has('debug');
const events = [];
function log(type, detail = '') {
  events.push(`${new Date().toISOString().slice(11, 19)} ${type} ${detail}`);
  if (events.length > 35) events.shift();
  if (debug) $('debug-log').textContent = events.join('\n');
  console.info('[FISI-AR]', type, detail);
}
if (debug) {
  const panel = document.createElement('details'); panel.id = 'debug-panel';
  panel.innerHTML = '<summary>Eventos AR</summary><pre id="debug-log"></pre>';
  document.body.append(panel);
}
const activeRoom = () => catalog?.ambientes[state.activeIndex];
function clearMovement() {
  keyboard.clear(); pointers.clear();
  document.querySelectorAll('[data-direction]').forEach(button => button.classList.remove('is-held'));
}
function stopSpeech(message = 'Toca Escuchar para iniciar la voz.') {
  utterance = null;
  if (speechAvailable) speechSynthesis.cancel();
  $('cancel-speech').disabled = true;
  $('speech-status').textContent = speechAvailable ? message : 'Este navegador no ofrece síntesis de voz.';
}
function update(event) {
  const before = state;
  state = transition(state, event);
  if (before === state) return;
  const changedTarget = before.activeIndex !== state.activeIndex;
  if (changedTarget || !state.tracked) { clearMovement(); stopSpeech(); }
  document.body.dataset.tracked = String(state.tracked);
  for (const [index, record] of actors) record.actor.object3D.visible = state.tracked && index === state.activeIndex;
  $('bubble').hidden = !state.tracked;
  document.querySelectorAll('.dpad button').forEach(button => button.disabled = !state.tracked);
  $('speak').disabled = !state.tracked || !speechAvailable;
  if (state.tracked) {
    const room = activeRoom();
    $('room-label').textContent = room.etiqueta;
    $('room-name').textContent = room.nombre;
    $('room-summary').textContent = room.resumen;
    $('room-description').textContent = room.descripcion;
    if (changedTarget || before.phase !== 'found') {
      $('room-details').open = false;
      $('speech-status').textContent = 'Toca Escuchar para iniciar la voz.';
      $('speak').textContent = 'Escuchar';
    }
    $('status').textContent = `${room.nombre}. Usa las flechas para mover al guía.`;
  } else {
    const messages = {
      starting: 'Autoriza la cámara. Preparando los letreros…',
      scanning: `Cámara lista. Puedes reconocer ${catalog.ambientes.length} letreros.`,
      lost: 'Letrero fuera de vista. Vuelve a encuadrarlo para recuperar al guía.'
    };
    if (messages[state.phase]) $('status').textContent = messages[state.phase];
  }
  log(typeof event === 'string' ? event : event.type, state.activeIndex ?? '');
}
function releaseCamera() {
  clearMovement(); stopSpeech();
  try { arSystem?.controller?.stopProcessVideo(); } catch { /* May be initializing. */ }
  try { arSystem?.controller?.dispose(); } catch { /* Context may be unavailable. */ }
  const video = arSystem?.video;
  video?.srcObject?.getTracks().forEach(track => track.stop());
  if (video) { video.pause(); video.srcObject = null; video.remove(); }
  for (const record of actors.values()) record.actor.object3D.visible = false;
  scene?.pause();
}
function fail(message) {
  if (terminated) return;
  terminated = true; update('error'); releaseCamera();
  document.body.classList.remove('ar-active');
  $('welcome').hidden = false; $('scanner').hidden = true;
  $('error').textContent = message; $('error').hidden = false;
  $('status').textContent = 'Sesión detenida.';
  $('start').textContent = 'Volver a iniciar'; $('start').disabled = false;
  $('start').onclick = () => location.reload();
}
function frame(delta) {
  if (terminated || !state.tracked) return;
  const record = actors.get(state.activeIndex);
  if (!record?.anchor.object3D.visible || !scene.camera) { $('bubble').hidden = true; return; }
  const directions = new Set([...keyboard, ...pointers.values()]);
  const offset = moveOffset(offsets.get(state.activeIndex), directions, delta);
  offsets.set(state.activeIndex, offset);
  record.actor.object3D.position.set(record.baseX + offset.x, record.baseY + offset.y, 0.25);
  record.shape.object3D.updateWorldMatrix(true, false);
  point.set(0, 0.7, 0); record.shape.object3D.localToWorld(point); point.project(scene.camera);
  if (!Number.isFinite(point.x) || point.z < -1 || point.z > 1 || Math.abs(point.x) > 1.25 || Math.abs(point.y) > 1.25) {
    $('bubble').hidden = true; return;
  }
  const bubble = $('bubble'); bubble.hidden = false;
  const width = document.documentElement.clientWidth, height = window.innerHeight;
  const headX = (point.x + 1) * width / 2;
  bubble.style.width = `${Math.min(230, Math.max(160, Math.max(headX, width - headX) - 64))}px`;
  const box = placeBubble({ x: headX, y: (1 - point.y) * height / 2,
    width: bubble.offsetWidth, height: bubble.offsetHeight, viewportWidth: width, viewportHeight: height });
  bubble.style.transform = `translate3d(${box.left}px,${box.top}px,0)`;
  bubble.style.left = '0'; bubble.style.top = '0';
  bubble.dataset.side = box.side; bubble.style.setProperty('--tail-left', `${box.tail}px`); bubble.style.setProperty('--tail-top', `${box.tailY}px`);
}
async function start() {
  if (state.phase !== 'idle') return;
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    fail('La cámara necesita HTTPS o localhost. Consulta la configuración segura en el README.'); return;
  }
  $('start').disabled = true; $('welcome').hidden = true; $('scanner').hidden = false;
  document.body.classList.add('ar-active'); window.scrollTo(0, 0); update('start');
  try {
    point = new AFRAME.THREE.Vector3();
    if (!AFRAME.components['fisi-frame']) AFRAME.registerComponent('fisi-frame', { tick(_time, delta) { frame(delta || 0); } });
    scene = document.createElement('a-scene'); scene.setAttribute('embedded', '');
    scene.setAttribute('fisi-frame', '');
    scene.setAttribute('mindar-image', `imageTargetSrc: ${catalog.targetFile}; autoStart: false; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no; warmupTolerance: 5; missTolerance: 8`);
    scene.setAttribute('renderer', 'colorManagement: true; alpha: true; antialias: false; precision: medium');
    scene.setAttribute('vr-mode-ui', 'enabled: false'); scene.setAttribute('xr-mode-ui', 'enabled: false');
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
    scene.innerHTML = '<a-camera position="0 0 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera><a-light type="ambient" intensity="0.85"></a-light><a-light type="directional" position="1 2 3" intensity="0.8"></a-light>';
    for (const room of catalog.ambientes) {
      const anchor = document.createElement('a-entity');
      anchor.setAttribute('mindar-image-target', `targetIndex: ${room.targetIndex}`);
      anchor.dataset.targetIndex = room.targetIndex;
      anchor.innerHTML = `<a-entity class="guide-position" visible="false">${avatarMarkup()}</a-entity>`;
      const actor = anchor.querySelector('.guide-position'), shape = anchor.querySelector('.avatar-shape');
      actors.set(room.targetIndex, { anchor, actor, shape, baseX: room.height / room.width > 2 ? -0.48 : -0.3, baseY: Math.min(0.45, room.height / room.width * 0.18) });
      offsets.set(room.targetIndex, { x: 0, y: 0 });
      anchor.addEventListener('targetFound', () => { if (!terminated) update({ type: 'found', index: room.targetIndex }); });
      anchor.addEventListener('targetLost', () => { if (!terminated) update({ type: 'lost', index: room.targetIndex }); });
      scene.append(anchor);
    }
    scene.addEventListener('arReady', () => { if (!terminated) update('ready'); });
    scene.addEventListener('arError', () => fail('No se pudo abrir la cámara. Comprueba el permiso del sitio y que ninguna otra aplicación la esté usando.'));
    scene.addEventListener('renderstart', () => {
      arSystem = scene.systems['mindar-image-system'];
      const nativeStartAR = arSystem._startAR.bind(arSystem);
      // Version-pinned MindAR starts asynchronously; also catch failures loading targets or WebGL.
      arSystem._startAR = async () => {
        if (terminated) { releaseCamera(); return; }
        try {
          arSystem.video.srcObject?.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
            if (!terminated) fail('La cámara se desconectó. Vuelve a iniciar.');
          }));
          await nativeStartAR(); if (terminated) releaseCamera();
        } catch (error) { console.error(error); fail('No se pudo preparar el reconocimiento. Comprueba WebGL y el archivo de objetivos.'); }
      };
      arSystem.start();
    }, { once: true });
    $('ar-stage').append(scene);
  } catch (error) { console.error(error); fail('No se pudo iniciar la escena 3D. Recarga y comprueba el navegador.'); }
}
for (const button of document.querySelectorAll('[data-direction]')) {
  button.addEventListener('pointerdown', event => {
    if (!state.tracked) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, button.dataset.direction); button.classList.add('is-held');
  });
  const release = event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId); button.classList.remove('is-held');
    log('guideMoved', JSON.stringify(offsets.get(state.activeIndex)));
  };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}
const arrowKeys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
window.addEventListener('keydown', event => {
  if (!state.tracked || !arrowKeys[event.key] || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  event.preventDefault(); keyboard.add(arrowKeys[event.key]);
});
window.addEventListener('keyup', event => { if (arrowKeys[event.key]) { keyboard.delete(arrowKeys[event.key]); if (state.tracked) log('guideMoved', JSON.stringify(offsets.get(state.activeIndex))); } });
window.addEventListener('blur', clearMovement);
$('reset-position').onclick = () => {
  if (!state.tracked) return; clearMovement(); offsets.set(state.activeIndex, { x: 0, y: 0 }); log('guideReset', state.activeIndex);
};
$('collapse-bubble').onclick = () => {
  const collapsed = $('bubble').classList.toggle('is-collapsed');
  $('bubble-body').hidden = collapsed; $('collapse-bubble').textContent = collapsed ? '+' : '−';
  $('collapse-bubble').setAttribute('aria-expanded', String(!collapsed));
  $('collapse-bubble').setAttribute('aria-label', collapsed ? 'Expandir información' : 'Plegar información');
};
$('stop').onclick = () => { terminated = true; releaseCamera(); location.reload(); };
$('cancel-speech').onclick = () => { stopSpeech('Narración detenida.'); log('speechStopped'); };
$('speak').onclick = () => {
  if (!state.tracked || !speechAvailable) return;
  stopSpeech(); const current = new SpeechSynthesisUtterance(activeRoom().narracion); utterance = current;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => /^es[-_]PE$/i.test(v.lang)) || voices.find(v => /^es(?:[-_]|$)/i.test(v.lang));
  if (voice) current.voice = voice; current.lang = voice?.lang || 'es-PE'; current.rate = 0.95;
  $('cancel-speech').disabled = false; $('speak').textContent = 'Repetir';
  current.onstart = () => { if (utterance === current) { $('speech-status').textContent = 'Narrando en español.'; log('speechStarted', state.activeIndex); } };
  current.onend = () => { if (utterance === current) { utterance = null; $('cancel-speech').disabled = true; $('speech-status').textContent = 'Presentación terminada.'; log('speechEnded'); } };
  current.onerror = event => { if (utterance === current) { utterance = null; $('cancel-speech').disabled = true; $('speech-status').textContent = `No se pudo reproducir la voz: ${event.error}.`; log('speechError', event.error); } };
  speechSynthesis.speak(current);
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ['starting', 'scanning', 'found', 'lost'].includes(state.phase)) fail('La sesión se cerró al salir de la página. Vuelve a iniciar para activar la cámara.');
});
window.addEventListener('pagehide', () => { terminated = true; releaseCamera(); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
function renderCatalog() {
  $('catalog-count').textContent = `${catalog.ambientes.length} ambientes`;
  for (const room of catalog.ambientes) {
    const article = document.createElement('article'); article.className = 'catalog-card';
    const image = document.createElement('img'); image.src = room.imagenObjetivo; image.alt = `Objetivo: ${room.nombre}`; image.loading = 'lazy';
    const content = document.createElement('div'), title = document.createElement('h3'), label = document.createElement('p'), link = document.createElement('a');
    title.textContent = room.nombre; label.textContent = room.etiqueta;
    link.textContent = 'Ver referencia'; link.href = room.imagenReferencia; link.target = '_blank'; link.rel = 'noopener';
    content.append(title, label, link); article.append(image, content); $('catalog').append(article);
  }
  for (const pending of catalog.pendientes) {
    const li = document.createElement('li'); li.textContent = `${pending.nombre}: ${pending.motivo}`; $('pending-list').append(li);
  }
}
try {
  if (document.readyState !== 'complete') await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  if (!window.AFRAME?.components['mindar-image']) throw new Error('Bibliotecas AR no disponibles.');
  const response = await fetch('./data/ambientes.json'); if (!response.ok) throw new Error('Catálogo no disponible.');
  catalog = await response.json();
  if (!catalog.ambientes.length || catalog.ambientes.some((room, index) => room.targetIndex !== index)) throw new Error('Índices de objetivos incorrectos.');
  const target = await fetch(catalog.targetFile); if (!target.ok || (await target.arrayBuffer()).byteLength < 100) throw new Error('Archivo .mind ausente o vacío.');
  renderCatalog(); $('start').textContent = 'Activar cámara'; $('start').disabled = false; $('start').onclick = start;
  $('status').textContent = 'Listo para explorar. La cámara se activa al tocar el botón.';
} catch (error) { console.error(error); fail(`Error al cargar: ${error.message}`); }
