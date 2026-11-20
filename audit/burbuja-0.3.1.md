# Burbuja: contenido expandido — versión 0.3.1

Problema reportado y observado en Android: al abrir «Más información», el texto podía dibujarse fuera del fondo de la burbuja. Se reprodujo en el navegador a 360 × 672: el cuerpo sobrepasaba el límite interior inferior en 36,8 px.

La altura del cuerpo se calculaba restando 90 px fijos a la altura máxima del panel. El encabezado y el nombre de ambientes largos podían ocupar más de ese espacio. El panel tenía altura máxima pero sus hijos mantenían una altura mayor y su contenido podía sobresalir.

Se reemplaza esa resta por una columna flexible con una región de contenido que puede reducirse (`min-height: 0`) y desplazarse. El nombre, el resumen y la descripción comparten el mismo desplazamiento interior. El encabezado y el botón para plegar permanecen fuera de esa región. Se conserva la cola externa de la burbuja, sin recortarla. La región admite desplazamiento vertical táctil y foco de teclado. El CSS se publica con versión nueva para evitar usar la hoja anterior desde caché.

Validación en navegador, con el catálogo real y una escena de interfaz controlada:

- 9 ambientes × 2 estados de «Más información» × 3 tamaños de fuente (16, 20 y 24 px) × 5 pantallas = **270 casos aprobados**.
- Pantallas: 320 × 568, 360 × 672, 390 × 844, 412 × 915 y 740 × 360.
- Se midió que la región desplazable quede dentro del borde, que no tenga desbordamiento horizontal y que la última línea de la descripción sea visible al desplazarse al final.
- Compilación de Pages válida con 9 objetivos; suite existente de 13 pruebas aprobada.
- Escena AR con entrada de cámara simulada: MindAR reconoció Sistemas de Información 01; se abrió «Más información», se desplazó la descripción con eventos de entrada del navegador y se comprobó plegar/expandir. La descripción permaneció dentro del panel.

Estas comprobaciones verifican el diseño responsivo en navegador. No se ha controlado un dispositivo Android físico desde este entorno.
