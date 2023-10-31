import { Point } from './geometry.models';

export interface PlayerData {
  position: Point;
  boomAmount: number;
  name: string;
  angle: number;
  xDir: number;
  yDir: number;
  spriteWidth: number;
  spriteHeight: number;
  teamColor: string;
  boomColor: string;
  teamName: string;
}

export const defaultPlayer: PlayerData = {
  position: { x: 0.0, y: 0.0 },
  boomAmount: 0.0,
  name: '',
  angle: 0.0,
  xDir: 0.0,
  yDir: 0.0,
  spriteWidth: 24.0,
  spriteHeight: 24.0,
  teamColor: '',
  boomColor: '',
  teamName: 'unassigned',
};
