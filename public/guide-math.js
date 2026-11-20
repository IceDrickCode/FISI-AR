const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function moveOffset(offset, directions, deltaMs, bounds = 1.4) {
  const x = Number(directions.has('right')) - Number(directions.has('left'));
  const y = Number(directions.has('up')) - Number(directions.has('down'));
  const magnitude = Math.hypot(x, y);
  if (!magnitude) return offset;
  const step = 0.75 * clamp(deltaMs, 0, 50) / 1000;
  return { x: clamp(offset.x + x / magnitude * step, -bounds, bounds), y: clamp(offset.y + y / magnitude * step, -bounds, bounds) };
}
export function placeBubble({ x, y, width, height, viewportWidth, viewportHeight }) {
  const inset = 12, top = 90, bottom = 178;
  const gap = 52;
  const canRight = x + gap + width <= viewportWidth - inset;
  const canLeft = x - gap - width >= inset;
  const above = y - height - 28;
  const side = canRight ? 'right' : canLeft ? 'left' : above >= top ? 'above' : 'below';
  const left = clamp(canRight ? x + gap : canLeft ? x - gap - width : x - width / 2, inset, Math.max(inset, viewportWidth - width - inset));
  const preferred = canLeft || canRight ? y - 40 : side === 'above' ? above : y + 52;
  const bubbleTop = clamp(preferred, top, Math.max(top, viewportHeight - height - bottom));
  return { left, top: bubbleTop, side, tail: clamp(x - left, 18, width - 18), tailY: clamp(y - bubbleTop, 20, height - 20) };
}
