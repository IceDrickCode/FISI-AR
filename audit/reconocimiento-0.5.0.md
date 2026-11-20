# Reconocimiento y aparición — 0.5.0

## Causas comprobadas

- MindAR estaba configurado con `warmupTolerance: 5`: exige seis actualizaciones válidas antes de emitir el ancla. El filtro propio volvía a exigir al menos cuatro muestras y 140 ms. Según la frecuencia, eran 9–11 actualizaciones antes de mostrar al personaje.
- Las muestras del filtro se tomaban en el tick de A-Frame. Si el dibujo iba lento, el filtro no recibía todas las poses que el reconocimiento ya producía. Se reprodujo una espera de aproximadamente 3 s entre `targetFound` y aparición del avatar con la versión 0.4.0 en el entorno de prueba.
- Varios objetivos incluían dos placas, paredes o grandes espacios alrededor del nombre. Enfoques parciales podían detectar rasgos pero no reunir suficientes puntos de seguimiento del objetivo compuesto.
- El worker original aceptaba el primer candidato geométricamente válido. Se observaron confusiones entre laboratorios que comparten formato, aunque el candidato verdadero tuviera una coincidencia más sólida.

## Corrección

- MindAR confirma dos actualizaciones (`warmupTolerance: 1`). La primera pose nativa confirmada se presenta sin una segunda espera; el rechazo de matrices inválidas y saltos, la mediana y el suavizado permanecen para las actualizaciones siguientes.
- `targetUpdate` alimenta el filtro en una microtarea después de que MindAR asigne la matriz. La primera visualización se actualiza y dibuja sin esperar otro tick. Se precalientan los materiales y se limita la resolución de renderizado a 1,5×.
- Entrada de cámara acotada, sin audio, con preferencia por cámara trasera y foco continuo cuando está disponible. Se prueban también permiso denegado y permiso que llega después de cerrar la sesión.
- Cinco objetivos nuevos aíslan placas reales: Redes, Sistemas 01, Sistemas 02, Telemática y Postgrado. Los otros cuatro se reutilizan. La normalización bicúbica permite generar por reducción el nivel activo de seguimiento de 128 px; no añade texto, dibujos ni información inexistente. Se conservan las imágenes fuente.
- Comparación de todos los candidatos con las mismas funciones oficiales de matching y estimación de MindAR. Gana el mayor número de correspondencias geométricas; se rechazan coincidencias débiles y empates cercanos. Nuevo worker empaquetado durante el build, con unos 89 KB en ejecución.
- `pantalla.html` muestra los nueve objetivos ampliados, con selector y opción de pantalla completa, para apuntar desde otro dispositivo. No abre cámara ni sube imágenes.

## Verificación realizada

- 23 pruebas automatizadas aprobadas, incluyendo estabilidad posterior, adquisición sin dependencia del renderizado, orden de candidatos, ambigüedad, cámara y funciones existentes.
- Nueve de nueve ambientes reconocidos con identidad correcta en una entrada de cámara sintética con marco, escala y giro de aproximadamente 3,4°. En una ejecución con la vista activa se midieron 56–144 ms desde presentar la placa hasta mostrar el avatar, con 3–6 ms adicionales después de `targetFound`.
- Foto compuesta de Redes: se reconoce la placa dentro de la imagen original con ambas señales y un marco alrededor, sin necesitar que el flujo sea idéntico al archivo objetivo nuevo.
- Página de laptop renderizada y capturada completa, incluida su interfaz, usada como entrada sintética: Sistemas 01 se reconoció correctamente; en esa ejecución el tiempo total fue de unos 2,1 s y la espera después de `targetFound`, de unos 18 ms. La complejidad, escala y ejecución en segundo plano alteran la latencia: las cifras anteriores no constituyen una garantía por dispositivo.
- Catálogo, imágenes, índices, dimensiones y hashes del `.mind` se verifican en las pruebas y el build. Los puntos de seguimiento activos son suficientes en los nueve objetivos.

## Límites prácticos y pruebas pendientes

Las pruebas de cámara utilizan `canvas.captureStream`, no una cámara física de Android frente a una pantalla real. Queda medir con el teléfono del usuario la latencia, enfoque, reflejos, moiré y funcionamiento frente a los letreros físicos. No se garantiza reconocimiento instantáneo con letras pequeñas, imagen borrosa o movimiento rápido. Se reconoce el diseño visual registrado; no se ha añadido OCR de texto libre. La configuración nativa se contrastó con la [documentación oficial de MindAR](https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/).
