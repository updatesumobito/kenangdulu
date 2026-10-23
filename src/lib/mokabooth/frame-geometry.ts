/** Millimeter geometry adapter for the existing center-pivot booth renderer. */
export type Point = { x: number; y: number };
export type Box = Point & { w: number; h: number; rotation?: number };
export const RESIZE_ANCHORS = ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"] as const;
export type ResizeAnchor = typeof RESIZE_ANCHORS[number];
export const MIN_SLOT_MM = 24 * 25.4 / 300;
export function rotate(point: Point, angle: number): Point {
  const radians = angle * Math.PI / 180;
  return { x: point.x * Math.cos(radians) - point.y * Math.sin(radians), y: point.x * Math.sin(radians) + point.y * Math.cos(radians) };
}
export function anchorPoint(box: Box, anchor: ResizeAnchor): Point {
  const x = anchor.endsWith("left") ? -box.w / 2 : anchor.endsWith("right") ? box.w / 2 : 0;
  const y = anchor.startsWith("top") ? -box.h / 2 : anchor.startsWith("bottom") ? box.h / 2 : 0;
  const offset = rotate({x,y}, box.rotation ?? 0);
  return {x:box.x + box.w/2 + offset.x,y:box.y + box.h/2 + offset.y};
}
export function oppositeAnchor(anchor: ResizeAnchor): ResizeAnchor {
  return anchor.replace("left","RIGHT").replace("right","left").replace("RIGHT","right").replace("top","BOTTOM").replace("bottom","top").replace("BOTTOM","bottom") as ResizeAnchor;
}
/** Resize in local axes; preserve the opposite corner or side midpoint. */
export function resizeBox(original: Box, anchor: ResizeAnchor, pointer: Point, ratio?: number | null, minimum = MIN_SLOT_MM): Box {
  if (![original.x,original.y,original.w,original.h,pointer.x,pointer.y,minimum,original.rotation ?? 0].every(Number.isFinite) || original.w <= 0 || original.h <= 0 || minimum <= 0) throw new Error("Geometri tidak valid.");
  if (ratio != null && (!Number.isFinite(ratio) || ratio <= 0)) throw new Error("Rasio tidak valid.");
  const fixed = anchorPoint(original, oppositeAnchor(anchor));
  const local = rotate({x:pointer.x-fixed.x,y:pointer.y-fixed.y}, -(original.rotation ?? 0));
  const sx = anchor.endsWith("left") ? -1 : anchor.endsWith("right") ? 1 : 0;
  const sy = anchor.startsWith("top") ? -1 : anchor.startsWith("bottom") ? 1 : 0;
  let w = sx ? Math.max(minimum, sx * local.x) : original.w;
  let h = sy ? Math.max(minimum, sy * local.y) : original.h;
  if (ratio != null) {
    if (!sx) w = h * ratio;
    else if (!sy) h = w / ratio;
    else {
      // Orthogonal projection onto the fixed-ratio diagonal, without pointer flips.
      h = Math.max(minimum, (sx * local.x * ratio + sy * local.y) / (ratio * ratio + 1));
      w = h * ratio;
    }
    const factor = Math.max(1, minimum/w, minimum/h);
    w *= factor; h *= factor;
  }
  const offset = rotate({x:sx*w/2,y:sy*h/2}, original.rotation ?? 0);
  return {...original,x:fixed.x+offset.x-w/2,y:fixed.y+offset.y-h/2,w,h};
}
export function pointerToDocument(pointer: Point, viewport: Point & {scale:number}): Point {
  if (!Number.isFinite(viewport.scale) || viewport.scale <= 0) throw new Error("Zoom tidak valid.");
  return {x:(pointer.x-viewport.x)/viewport.scale,y:(pointer.y-viewport.y)/viewport.scale};
}
export function worldBounds(box: Box): Box {
  const points = ["top-left","top-right","bottom-left","bottom-right"].map(anchor => anchorPoint(box,anchor as ResizeAnchor));
  const x=Math.min(...points.map(p=>p.x)), y=Math.min(...points.map(p=>p.y));
  return {x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y};
}
