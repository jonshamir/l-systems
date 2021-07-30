const math = require("canvas-sketch-util/math");

export const transformPlayhead = (playhead, start, end) => {
  const length = end - start;
  return math.clamp01((1 / length) * (playhead - start));
};

export const easeIn = (x) => x * x * x;
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const parabolic = (x) => 1 - Math.pow(2 * x - 1, 2);
export const cyclic = (x) => (Math.sin((2 * x - 0.5) * Math.PI) + 1) / 2;

export const randInRange = (r) => Math.random() * r * 2 - r;

export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => rad * (180 / Math.PI);

export const stringToHex = (str) => parseInt(str.substring(1), 16);
export const getPointOnSphere = (radius) => {
  var u = Math.random();
  var v = Math.random();
  var theta = 2 * Math.PI * u;
  var phi = Math.acos(2 * v - 1);
  var x = radius * Math.sin(phi) * Math.cos(theta);
  var y = radius * Math.sin(phi) * Math.sin(theta);
  var z = radius * Math.cos(phi);
  return [x, y, z];
};
