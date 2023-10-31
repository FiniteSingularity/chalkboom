import { Point } from './geometry.models';

export interface Boom {
  playerName: string;
  team: string;
  position: Point;
  color: string;
  zIndex: number;
  radius: number;
  maxRadius: number;
  boomRate: number;
  complete: boolean;
  overlap: Boom[];
}
