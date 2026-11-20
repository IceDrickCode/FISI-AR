# FISI-AR

Aplicación WebAR para explorar los letreros de la Facultad de Ingeniería de Sistemas e Informática de la UNSM con **Byte**, un robot con detalles inspirados en hojas, ríos y circuitos.

HTML, CSS y JavaScript, MindAR 1.2.5, A-Frame 1.5.0 y Web Speech API. Sin backend ni base de datos.

## Misión Byte — versión 0.4.0

Cada letrero ofrece una ficha con actividades, recursos, cantidades y horarios **ficticios de demostración**, señalados como datos de ejemplo no oficiales tanto en pantalla como en la narración. Los nombres de los ambientes siguen basándose en evidencia visual.

Abre **Reto de Byte**, responde la pregunta y gana el sello de ese ambiente. Las respuestas incorrectas permiten volver a intentar; repetir un reto completado no duplica sellos. El pasaporte muestra los nueve ambientes y conserva el progreso solo en el navegador mediante almacenamiento local; si está bloqueado, funciona durante la sesión. No se recopilan datos personales.

Byte incorpora un anillo de datos con nodos en órbita y celebra cada sello nuevo levantando ambos brazos. Sus efectos son locales al modelo y respetan la preferencia de movimiento reducido. El seguimiento del letrero mantiene su filtro independiente.

## Usar la aplicación

Abre el sitio publicado en GitHub Pages desde Chrome para Android, toca **Activar cámara** y permite el acceso. Encuadra la placa del nombre del ambiente; en Redes y los laboratorios de Sistemas incluye también la señal vertical. El catálogo muestra la imagen de referencia de cada objetivo.

Mantén pulsadas las flechas de pantalla o teclado para desplazar a Byte. El centro restablece su posición. La burbuja se puede plegar; la narración empieza al tocar **Escuchar**. Perder el objetivo oculta al guía y cancela la voz.

El catálogo contiene nueve ambientes, incluido **Servicios Higiénicos Caballeros**, incorporado con la foto del 20/11/2026. Su objetivo usa el texto y el pictograma para reducir la influencia de reflejos; la placa sigue siendo metálica. Se conserva la discrepancia visual Sistemas de Información 02 / señal vertical 04. Las fichas actuales son ejemplos ficticios y deberán sustituirse por información validada antes de usarlas como guía institucional.

El seguimiento separa el ancla calculada por MindAR del ancla visual de Byte. Exige cuatro poses válidas durante al menos 140 ms, aplica mediana y suavizado de posición/rotación/escala, y rechaza saltos anómalos. Una pérdida breve conserva la última pose hasta 180 ms; después oculta al guía. El procesamiento lento no se confunde con una pérdida: una pose sin actualización caduca a los 2,5 s. Las flechas mantienen su desplazamiento local independiente. La burbuja conserva su lado cerca de los límites y el renderizador usa antialiasing con resolución de hasta 2×.

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
