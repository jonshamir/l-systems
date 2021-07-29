const canvasSketch = require("canvas-sketch");
var LSystem = require("lindenmayer");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");
const { GUI } = require("dat.gui");
const chroma = require("chroma-js");

const { easeIn, easeOut, transformPlayhead } = require("./utils.js");

const data = {
  iterations: 4,
  angle: 45,
  lineWidth: 6,
  widthDecay: 1,
  lineLength: 5,
  lengthDecay: 1,
  background: "#fafafa",
  lineColor: "#666666",
  //lineJoin: 3,
  viewX: 0.5,
  viewY: 0.8,
};

const settings = {
  duration: 2,
  dimensions: [1000, 1000],
  scaleToView: true,
  playbackRate: "throttle",
  animate: true,
  fps: 30,
  data,
};

const sketch = (settings) => {
  const { context, frame, width, height, playhead, data } = settings;

  return { render };
};

function render({ context, frame, width, height, playhead }) {
  playhead = 0.8;
  context.clearRect(0, 0, width, height);
  context.fillStyle = data.background;
  context.fillRect(0, 0, width, height);
  context.lineWidth = data.lineWidth;
  context.lineJoin = "miter"; // "miter" || "bevel" || "round"
  context.lineCap = "square"; // "butt" || "round" || "square"

  // Fade out at the end
  context.strokeStyle = chroma.mix(
    data.lineColor,
    data.background,
    easeIn(transformPlayhead(playhead, 0.85, 0.95))
  );

  drawLSystem(
    context,
    width,
    height,
    transformPlayhead(playhead, 0, 0.9),
    data
  );
}

function drawLSystem(context, width, height, playhead, data) {
  const angle = data.angle * easeOut(playhead);
  const lineLength = data.lineLength * easeOut(playhead);

  let plantSystem = new LSystem({
    axiom: "X",
    productions: { F: "FF", Y: "F", X: "FFF[+X][-X]FX" },
    finals: {
      "+": () => {
        context.rotate((Math.PI / 180) * angle);
      },
      "-": () => {
        context.rotate((Math.PI / 180) * -angle);
      },
      F: () => {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -context.shadowOffsetX);
        context.stroke();
        context.translate(0, -context.shadowOffsetX);
      },
      "[": () => {
        context.save();
        context.lineWidth *= data.widthDecay;
        context.shadowOffsetX *= easeOut(playhead) * data.lengthDecay;
      },
      "]": () => {
        context.restore();
      },
    },
  });

  context.translate(data.viewX * width, data.viewY * height);
  context.shadowOffsetX = lineLength;
  let result = plantSystem.iterate(data.iterations);
  plantSystem.final();
}

(async () => {
  const manager = await canvasSketch(sketch, settings);

  const useGUI = true;
  if (useGUI) {
    const gui = new GUI();

    // Setup parameters
    let systemFolder = gui.addFolder("L-System");
    add(systemFolder, data, "iterations", 1, 10).step(1);
    add(systemFolder, data, "angle", 0, 180);
    add(systemFolder, data, "lineWidth", 1, 50);
    add(systemFolder, data, "widthDecay", 0, 1);
    add(systemFolder, data, "lineLength", 1, 200);
    add(systemFolder, data, "lengthDecay", 0, 1);

    let styleFolder = gui.addFolder("Style & View");
    addColor(styleFolder, data, "background");
    addColor(styleFolder, data, "lineColor");
    add(styleFolder, data, "viewX", 0, 1);
    add(styleFolder, data, "viewY", 0, 1);
  }

  // Helper functions
  function addColor(gui, ...args) {
    return gui.addColor(...args).onChange(render);
  }

  function add(gui, ...args) {
    return gui.add(...args).onChange(render);
  }

  function render() {
    manager.render();
  }
})();
