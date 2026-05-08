import { POINTS_PER_ORB } from './constants';

export function calcPoints(combo: number): number {
  return POINTS_PER_ORB * Math.max(1, combo);
}
