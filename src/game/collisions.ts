export interface Circle {
  x: number;
  y: number;
  r: number;
}

export function circleCircle(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rSum = a.r + b.r;
  return dx * dx + dy * dy < rSum * rSum;
}

export function circleCircleShrunk(a: Circle, b: Circle, shrink: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const rSum = a.r + b.r - shrink;
  return dx * dx + dy * dy < rSum * rSum;
}
