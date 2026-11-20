# FISI-AR

Aplicación WebAR para explorar los letreros de la Facultad de Ingeniería de Sistemas e Informática de la UNSM con **Byte**, un robot con detalles inspirados en hojas, ríos y circuitos.

HTML, CSS y JavaScript, MindAR 1.2.5, A-Frame 1.5.0 y Web Speech API. Sin backend ni base de datos.

## Reconocimiento rápido — versión 0.5.0

Para probar desde casa, abre `pantalla.html` en la laptop, selecciona un letrero y apúntale desde la cámara de FISI-AR en Android. La placa se amplía automáticamente; no se pide cámara en la laptop. El reconocimiento sigue basado en el diseño registrado, no en OCR de cualquier texto o cartel rediseñado.

Se eliminó la segunda espera de adquisición del avatar: tras las dos actualizaciones válidas requeridas por MindAR, la primera pose confirmada se muestra sin esperar varios frames de renderizado. El filtro recibe las poses desde `targetUpdate`, independientemente de los FPS de dibujo, y conserva la mediana, suavizado y rechazo de saltos posteriores. La cámara pide resolución acotada, preferencia por cámara trasera y foco continuo cuando el dispositivo lo permite; el renderizado limita su resolución a 1,5× con antialiasing.

Redes, Sistemas 01, Sistemas 02, Telemática y Postgrado usan su placa principal como objetivo. No requieren que otras placas estén visibles. El comparador evalúa las coincidencias geométricas de todos los candidatos y rechaza los empates cercanos para evitar que un laboratorio parecido gane solo por aparecer antes en el catálogo. Su worker está basado en el protocolo de MindAR 1.2.5 y se empaqueta con esbuild solo durante el desarrollo; el navegador descarga un archivo de aproximadamente 89 KB. `npm run build` vuelve a generarlo; `npm run build:recognizer` permite generarlo por separado.

Consulta `audit/reconocimiento-0.5.0.md` para los resultados y las pruebas pendientes en hardware real.

## Misión Byte — versión 0.4.0

Cada letrero ofrece una ficha con actividades, recursos, cantidades y horarios **ficticios de demostración**, señalados como datos de ejemplo no oficiales tanto en pantalla como en la narración. Los nombres de los ambientes siguen basándose en evidencia visual.

Abre **Reto de Byte**, responde la pregunta y gana el sello de ese ambiente. Las respuestas incorrectas permiten volver a intentar; repetir un reto completado no duplica sellos. El pasaporte muestra los nueve ambientes y conserva el progreso solo en el navegador mediante almacenamiento local; si está bloqueado, funciona durante la sesión. No se recopilan datos personales.

Byte incorpora un anillo de datos con nodos en órbita y celebra cada sello nuevo levantando ambos brazos. Sus efectos son locales al modelo y respetan la preferencia de movimiento reducido. El seguimiento del letrero mantiene su filtro independiente.

## Usar la aplicación

Abre el sitio publicado en GitHub Pages desde Chrome para Android, toca **Activar cámara** y permite el acceso. Centra la placa del nombre del ambiente con sus letras legibles. El catálogo permite abrir cada letrero ampliado para mostrarlo desde otra pantalla.

Mantén pulsadas las flechas de pantalla o teclado para desplazar a Byte. El centro restablece su posición. La burbuja se puede plegar; la narración empieza al tocar **Escuchar**. Perder el objetivo oculta al guía y cancela la voz.

El catálogo contiene nueve ambientes, incluido **Servicios Higiénicos Caballeros**, incorporado con la foto del 20/11/2026. Su objetivo usa el texto y el pictograma para reducir la influencia de reflejos; la placa sigue siendo metálica. Se conserva la discrepancia visual Sistemas de Información 02 / señal vertical 04. Las fichas actuales son ejemplos ficticios y deberán sustituirse por información validada antes de usarlas como guía institucional.

El seguimiento separa el ancla calculada por MindAR del ancla visual de Byte. Aplica mediana y suavizado de posición/rotación/escala, y rechaza saltos anómalos después de adquirir la pose confirmada. Una pérdida breve conserva la última pose hasta 180 ms; después oculta al guía. El procesamiento lento no se confunde con una pérdida: una pose sin actualización caduca a los 2,5 s. Las flechas mantienen su desplazamiento local independiente y la burbuja conserva su lado cerca de los límites.

La validación técnica con imágenes sintéticas y secuencias de poses no sustituye las pruebas con los letreros reales y un teléfono. Quedan pendientes estabilidad caminando frente al letrero, reflejos bajo diferentes iluminaciones, velocidad y calidad gráfica en Android. Consulta `audit/validacion-2026-11-20.md`.

## Desarrollo

Requiere Node.js 22 o posterior.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run build:pages
npm run dev
```

El servidor local abre en `http://127.0.0.1:5173`. En un teléfono, usa el sitio HTTPS publicado o un servidor HTTPS con un certificado confiado por el dispositivo.

`public/` contiene la fuente estática, `scripts/` el servidor y los compiladores, `tests/` las pruebas y `docs/` la copia lista para GitHub Pages.

## Publicar cambios en GitHub Pages

Ejecuta `npm run build:pages`, revisa los cambios y confirma tanto las fuentes como `docs/`. Pages publica desde **main /docs**. `.nojekyll` permite servir directamente los archivos estáticos.

Para cambiar objetivos, conserva sus índices ordenados en `public/data/ambientes.json`, ejecuta `npm run compile:target`, vuelve a ejecutar las pruebas y genera Pages. El compilador reutiliza su caché por objetivo cuando la imagen y la región de detección no cambian.

Las referencias públicas muestran los recortes de las placas. Se conservan las licencias y avisos de las bibliotecas en `public/vendor/`.
