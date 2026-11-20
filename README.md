# FISI-AR

Aplicación WebAR para explorar los letreros de la Facultad de Ingeniería de Sistemas e Informática de la UNSM con **Byte**, un robot con detalles inspirados en hojas, ríos y circuitos.

HTML, CSS y JavaScript, MindAR 1.2.5, A-Frame 1.5.0 y Web Speech API. Sin backend ni base de datos.

## Usar la aplicación

Abre el sitio publicado en GitHub Pages desde Chrome para Android, toca **Activar cámara** y permite el acceso. Encuadra la placa del nombre del ambiente; en Redes y los laboratorios de Sistemas incluye también la señal vertical. El catálogo muestra la imagen de referencia de cada objetivo.

Mantén pulsadas las flechas de pantalla o teclado para desplazar a Byte. El centro restablece su posición. La burbuja se puede plegar; la narración empieza al tocar **Escuchar**. Perder el objetivo oculta al guía y cancela la voz.

El catálogo contiene ocho ambientes. Caballeros está pendiente de una foto sin reflejos. Se conserva la discrepancia visual Sistemas de Información 02 / señal vertical 04. Las actividades y horarios requieren confirmación de la facultad. La validación técnica con imágenes sintéticas no sustituye las pruebas con los letreros reales y un teléfono.

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
