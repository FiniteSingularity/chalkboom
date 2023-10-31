export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  center: Point;
  r: number;
  color: [number, number, number];
}

export interface BoundingBox {
  minBound: Point; // Upper Left Corner
  maxBound: Point; // Lower Right Corner.
}
