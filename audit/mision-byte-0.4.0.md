# Misión Byte — 0.4.0

## Contenido y funcionamiento

Las nueve fichas incluyen actividades, recursos, cantidades, dinámicas u horarios **ficticios de demostración**. No son mediciones experimentales reales ni información institucional confirmada. Esta distinción se presenta en la portada, en la burbuja, en los campos del catálogo y en la narración. Los nombres de los ambientes y los objetivos de reconocimiento mantienen su evidencia visual.

Cada ambiente ofrece una pregunta con tres opciones. Una respuesta correcta concede un único sello; los errores permiten reintentar y los retos completados no duplican el progreso. El pasaporte conserva solo identificadores de ambientes en `localStorage`, sin datos personales ni backend. Si el almacenamiento está bloqueado, funciona durante la sesión y lo indica en pantalla.

Byte incorpora un anillo de datos con tres nodos en órbita. Un sello nuevo activa una celebración de 1,8 s con ambos brazos y el anillo, manteniendo independiente el seguimiento y el movimiento manual. Se respeta la preferencia de movimiento reducido. El modelo utiliza 7.265 triángulos y 56 mallas por avatar visible; se mantiene por debajo del presupuesto de 15.000 triángulos.

Al abrir una ficha o reto, la burbuja mantiene su posición en pantalla para que los botones no se desplacen durante la lectura o la respuesta. Su cola se actualiza hacia Byte. Al cerrar ambos apartados vuelve a acompañarlo. Cambiar de ambiente, perder el reconocimiento o cambiar el tamaño de la pantalla invalida esa posición.

## Validación

- 16 pruebas automatizadas aprobadas: geometría, seguimiento, movimiento, catálogo, datos de ejemplo, respuestas válidas/incorrectas, idempotencia y lectura de progreso corrupto.
- 540 casos de diseño aprobados: nueve ambientes × cuatro estados (cerrado, ficha, reto y ambos abiertos) × tres tamaños de fuente × cinco pantallas, incluida orientación horizontal. Se verifica contención, ausencia de desbordamiento horizontal y lectura de la última línea mediante desplazamiento interior.
- Navegador a 390 × 844 con entrada sintética de cámara: reconocimiento de Redes y Sistemas 01 mediante MindAR, respuestas incorrectas sin sellos, respuestas correctas con bloqueo de opciones, dos sellos distintos, celebración y apertura/cierre del pasaporte desde AR.
- Recarga: el sello de Redes se conserva y aparece en la portada. Dos sellos quedan almacenados tras resolver Sistemas 01.
- Narración: se verificó el aviso de ejemplo ficticio y el contenido de recursos simulados, con inicio manual y parada de voz.
- Almacenamiento bloqueado simulado: la interfaz informa que el progreso dura solo la sesión; resolver un reto sigue funcionando.
- No se recompilaron ni modificaron los objetivos `.mind` o las fotografías originales.

La cámara utilizada en estas pruebas fue una fuente de imágenes simulada. Quedan pendientes la prueba del nuevo flujo táctil, la legibilidad y el rendimiento con los letreros físicos desde Android.
