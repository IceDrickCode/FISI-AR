# Caballeros y estabilidad de Byte — 20/11/2026

## Evidencia y causa

- Foto nueva: JPEG de 899 × 1599. Se lee **Servicios Higiénicos Caballeros**, con pictograma masculino. Se conserva intacta la fotografía original (SHA-256 en `caballeros-2026-11-20.json`). Se publica solo un recorte de 640 × 430 de la placa.
- El metal presenta reflejos intensos. El objetivo restringe detección y seguimiento a regiones del texto y el pictograma; no supone que los reflejos sean rasgos permanentes.
- Antes del cambio, una secuencia de posiciones `[0, .01, -.01, .85, -.75, .02]` del ancla se transmitía idéntica al avatar. MindAR sobrescribe la matriz del ancla, de modo que filtrar su propiedad `position` no resuelve el problema.
- La burbuja alternaba `right/above/right/above` con solo 2 px de variación junto al límite de pantalla.
- En el navegador de prueba, la inferencia entregó poses aproximadamente cada 1 s. Una caducidad basada únicamente en 180 ms entre muestras producía parpadeos; se distingue ahora procesamiento lento de pérdida explícita del objetivo.

## Cambios

- Ancla visual independiente; mediana de cinco posiciones y suavizado de posición, rotación y escala, con rechazo de saltos y matrices inválidas.
- Adquisición con cuatro muestras y al menos 140 ms; conservación breve durante pérdida; ocultación y readquisición sin interpolar desde una pose antigua. Identidad estable cuando hay solapamiento temporal de detecciones.
- Movimiento de flechas independiente del seguimiento. Se conserva el parpadeo/saludo de Byte y se elimina la oscilación vertical automática del cuerpo en reposo.
- Burbuja con ancho constante por tamaño de pantalla y margen de 24 px para cambiar de lado. Tamaño del avatar proporcional al formato de la placa.
- Antialiasing, precisión alta y resolución limitada a 2×. Recursos y archivo `.mind` versionados para evitar mezclar el catálogo nuevo con objetivos antiguos en caché.
- Configuración del filtro nativo contrastada con [documentación oficial de MindAR](https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/); el equilibrio entre estabilidad y retardo requiere comprobación en cada dispositivo.

## Verificaciones realizadas

- `npm test`: 13 pruebas aprobadas, incluyendo ruido, saltos de posición/giro/escala, matrices inválidas, movimiento gradual, pérdida/readquisición, procesamiento lento, identidad y burbuja.
- `npm run build:pages`: compilación válida con nueve objetivos. Ocho objetivos anteriores reutilizados, verificados contra sus hashes; solo Caballeros compilado.
- Caballeros: 205 rasgos de detección en la escala mayor y 21 puntos de seguimiento en la escala usada en ejecución. Son métricas técnicas, no una tasa de acierto física.
- Navegador a 390 × 844 con cámara simulada mediante `canvas.captureStream`: reconocimiento real de MindAR, índice 8, aparición del avatar y burbuja. En 32 observaciones durante 3,2 s no hubo ocultaciones tras adquirir el objetivo.
- Flecha derecha del teclado mantenida 1 s: desplazamiento local horizontal de aproximadamente 0,76; botón central restaura la posición. Narración en español: inicio, finalización, repetición y parada verificadas por eventos.
- Pulsación mantenida del botón derecho mediante eventos de puntero del navegador: desplazamiento de aproximadamente 0,32 y liberación sin botones retenidos. El gesto táctil real en Android queda pendiente.
- Al retirar la imagen de la entrada simulada: eventos `rawLost/lost`, cero avatares visibles, burbuja oculta y controles deshabilitados.
- Secuencia Caballeros → Redes (índice 0) → Caballeros (índice 8) reconocida por MindAR; readquisición del personaje y actualización del ambiente. Consola sin errores JavaScript durante la prueba.

## Pendiente en dispositivo físico

Probar Chrome para Android frente a la placa real de Caballeros y los ocho letreros anteriores: iluminación/sombras, reflejos desde diferentes ángulos, enfoque, pequeñas vibraciones, desplazamiento deliberado de la cámara, pérdida/readquisición, flechas táctiles mantenidas, voz y rendimiento/temperatura. También comprobar el permiso de cámara con una cámara física y permiso denegado. La cámara usada aquí fue una entrada sintética; no demuestra reconocimiento o estabilidad en el lugar real. El filtrado introduce un pequeño retardo intencional y puede ocultar a Byte si el movimiento es demasiado brusco.
