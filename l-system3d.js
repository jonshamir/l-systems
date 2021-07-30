const canvasSketch = require("canvas-sketch");
var LSystem = require("lindenmayer");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");
const { GUI } = require("dat.gui");
const chroma = require("chroma-js");
global.THREE = require("three");
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "three.meshline";
import Turtle from "./Turtle";
require("three/examples/js/controls/OrbitControls");

const {
  easeIn,
  easeOut,
  transformPlayhead,
  getPointOnSphere,
} = require("./utils.js");

const data = {
  animate: false,
  iterations: 4,
  angleL: 22,
  randomnessL: 5,
  angleH: 24,
  randomnessH: 5,
  angleU: 45,
  randomnessU: 0,
  lineWidth: 7,
  widthDecay: 1,
  lineLength: 3.1,
  randomnessLength: 2,
  lineColor: "#666666",
  background: "#fafafa",
  viewX: 0.5,
  viewY: 0.8,
};

const settings = {
  duration: 10,
  dimensions: [1024, 1024],
  scaleToView: false,
  playbackRate: "throttle",
  animate: true,
  fps: 30,
  context: "webgl",
  data,
};

let lsystem, lsystemResult, lsystemAxiom;

const sketch = (settings) => {
  const { context, frame, width, height, playhead, data } = settings;

  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  const camera = new THREE.OrthographicCamera(-20, 20, 30, -10, 0.01, 100);

  camera.position.set(0, 0, -50);
  camera.lookAt(new THREE.Vector3());

  const controls = new THREE.OrbitControls(camera, context.canvas);
  controls.enablePan = false;
  // controls.autoRotate = true;
  controls.autoRotateSpeed = 5;

  const scene = new THREE.Scene();

  var turtle = new Turtle({
    scene: scene,
    pos: new THREE.Vector3(0, 0, 0),
    dir: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, 1),
    lineColor: data.lineColor,
  });

  // { F: "FF", X: "FFF[+/X][-/X]/FX" }
  // { F: "FG", G: "F", Y: "F", X: "FFF[--/X]+FX" }
  // { X: "[&FLX]/////[&FLX]/////[&FLX]", F: "S/////F", S: "FL" }

  lsystemAxiom = "X";
  lsystem = new LSystem({ axiom: lsystemAxiom });
  lsystem.setProductions({
    X: "[&FLX]/////[&FLX]/////[&FLX]",
    F: "S/////F",
    S: "FL",
  });
  // lsystem.setProduction("F", "FF");
  // lsystem.setProduction("X", {
  //   successors: [
  //     { weight: 1, successor: "F[-/X][+/X]/FX" },
  //     { weight: 0.1, successor: "F[-/X][+X]" },
  //     { weight: 0.1, successor: "F[-/X]/FX" },
  //     { weight: 0.1, successor: "F[+/X]/FX" },
  //   ],
  // });

  lsystemResult = lsystem.iterate(data.iterations);

  const draw = (playhead) => {
    if (!data.animate) playhead = 0.8;
    const growthPlayhead = transformPlayhead(playhead, 0, 0.6);
    renderer.setClearColor(data.background, 1);
    // Fade out at the end
    turtle.lineColor = chroma
      .mix(
        data.lineColor,
        data.background,
        easeIn(transformPlayhead(playhead, 0.85, 0.95))
      )
      .hex();
    turtle.lineWidth = data.lineWidth;
    turtle.lineLength = data.lineLength * easeOut(growthPlayhead);
    turtle.randomnessLength = data.randomnessLength;
    turtle.angleL = data.angleL * easeOut(growthPlayhead);
    turtle.angleH = data.angleH; // * easeOut(growthPlayhead);
    turtle.angleU = data.angleU; // * easeOut(growthPlayhead);
    turtle.randomnessL = data.randomnessL;
    turtle.randomnessH = data.randomnessH;
    turtle.randomnessU = data.randomnessU;

    turtle.clear();
    turtle.run(lsystemResult);
  };
  draw(playhead);

  return {
    render({ time, playhead }) {
      controls.update();
      renderer.render(scene, camera);
      if (data.animate) draw(playhead);
    },
    draw,
  };
};

(async () => {
  const manager = await canvasSketch(sketch, settings);

  const useGUI = true;
  if (useGUI) {
    const gui = new GUI();

    // Setup parameters
    add(gui, data, "animate");

    let systemFolder = gui.addFolder("L-System");
    add(systemFolder, data, "iterations", 1, 10)
      .step(1)
      .onChange(lsystemIterate);
    add(systemFolder, data, "angleL", 0, 180).onChange(draw);
    add(systemFolder, data, "randomnessL", 0, 10).onChange(draw);
    add(systemFolder, data, "angleH", 0, 180).onChange(draw);
    add(systemFolder, data, "randomnessH", 0, 10).onChange(draw);
    add(systemFolder, data, "angleU", 0, 180).onChange(draw);
    add(systemFolder, data, "randomnessU", 0, 10).onChange(draw);
    add(systemFolder, data, "lineWidth", 1, 50).onChange(draw);
    add(systemFolder, data, "widthDecay", 0, 1).onChange(draw);
    add(systemFolder, data, "lineLength", 0, 1).onChange(draw);
    add(systemFolder, data, "randomnessLength", 0, 10).onChange(draw);
    add(systemFolder, data, "lengthDecay", 0, 1).onChange(draw);

    let styleFolder = gui.addFolder("Style & View");
    addColor(styleFolder, data, "background");
    addColor(styleFolder, data, "lineColor");
    add(styleFolder, data, "viewX", 0, 1);
    add(styleFolder, data, "viewY", 0, 1);
  }

  // Helper functions
  function addColor(gui, ...args) {
    return gui.addColor(...args).onChange(draw);
  }

  function add(gui, ...args) {
    return gui.add(...args).onChange(draw);
  }

  function render() {
    manager.render();
  }

  function draw() {
    manager.sketch.draw();
  }

  function lsystemIterate() {
    lsystem.axiom = lsystemAxiom;
    lsystemResult = lsystem.iterate(data.iterations);
    manager.sketch.draw();
  }
})();
