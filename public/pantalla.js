const $ = id => document.getElementById(id);
try {
  const response = await fetch('./data/ambientes.json?v=0.5.0');
  if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
  const { ambientes } = await response.json();
  const requested = new URLSearchParams(location.search).get('ambiente');
  for (const room of ambientes) {
    const option = document.createElement('option'); option.value = room.id; option.textContent = room.nombre;
    $('screen-room').append(option);
  }
  $('screen-room').value = ambientes.some(r => r.id === requested) ? requested : ambientes[0].id;
  function show() {
    const room = ambientes.find(r => r.id === $('screen-room').value);
    $('screen-title').textContent = room.nombre;
    $('screen-image').alt = `Placa registrada: ${room.nombre}`;
    $('screen-image').src = room.imagenObjetivo; $('screen-image').hidden = false;
    const url = new URL(location.href); url.searchParams.set('ambiente', room.id); history.replaceState(null, '', url);
  }
  $('screen-room').disabled = false; $('screen-room').onchange = show; show();
  $('screen-image').onerror = () => { $('screen-error').textContent = 'No se pudo cargar la placa. Recarga la página.'; $('screen-error').hidden = false; };
  $('screen-full').hidden = !document.documentElement.requestFullscreen;
  $('screen-full').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('screen-full').textContent = 'Amplía la ventana para ver la placa'; }
  };
} catch (error) { $('screen-error').textContent = error.message; $('screen-error').hidden = false; }
