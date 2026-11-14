export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[(Math.random() * a.length) | 0];
export const cA = '#ffd166', cB = '#5ef2d6', cC = '#ff4d6d', cD = '#9bf6ff', cE = '#ff7b9c',
  cF = '#5f93a8', cG = '#ffb347', cH = '#ffc857', cI = '#d8fff8', cJ = '#06121b',
  cK = '#ffb3c0', cM = '#bffff8', cN = '#ffe066', cO = '#57b8ff', cP = '#b784ff';
export const PL = 'play', SH = 'shark', CB = 'crab', FR = 'free', BM = 'bomb', PF = 'puffer', DD = 'dead', OV = 'over';
export const COL = [cB, cO, cP, cH, cE, cD];
export const midi = m => 440 * Math.pow(2, (m - 69) / 12);
export const PI = Math.PI, S = Math.sin, C = Math.cos, A = Math.abs;
export const MN = Math.min, MX = Math.max, R = Math.random, F = Math.floor, RO = Math.round;
export const HY = Math.hypot, SG = Math.sign, PW = Math.pow;
