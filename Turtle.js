import { MeshLine, MeshLineMaterial, MeshLineRaycast } from "three.meshline";
import { randInRange, degToRad } from "./utils";

const Turtle = function (opts) {
  this._opts = opts;
  this.lineWidth = opts.lineWidth;
  this.lineLength = opts.lineLength;
  this.lineColor = opts.lineColor;
  this.randomnessLength = opts.randomnessLength;
  this.name = opts.name;
  this.pos = opts.pos.clone();
  this.dir = opts.dir.clone();
  this.up = opts.up.clone();
  this.sceneChildren = [];
  this.idx = -1;
  this.results = [];
  this.birth = 0;
  this.age = -1;
  this.remainingLife = -1;
  this.adulthood = -1;
  this.scene = opts.scene;
  this.angleL = 60;
  this.angleH = 90;
  this.angleU = 45;
  this.randomnessL = opts.randomnessL;
  this.randomnessH = opts.randomnessH;
  this.randomnessU = opts.randomnessU;
};

Turtle.prototype = {
  idx: -1,
  pos: null,
  dir: null,
  stack: [],
  vertices: [],
  segments: [],
  leaves: [],
  sceneChildren: [],
  results: [],
  lineWidth: 10,
  run: function (cmd, opts) {
    this.age++;
    this._cmd = cmd;
    this.currIndex = 0;
    while (this.currIndex < cmd.length) {
      // / represents head turn, + represents up turn, & represents right turn
      switch (cmd[this.currIndex]) {
        case "F":
          const replacePrev = cmd[this.currIndex - 1] === "F";
          const oldPos = this.pos.clone();
          this.pos.add(
            this.dir
              .clone()
              .multiplyScalar(
                this.lineLength + randInRange(this.randomnessLength)
              )
          );
          this.addSegment(oldPos, this.pos.clone(), replacePrev);
          break;
        case "L":
          this.addLeaf();
          break;
        case "-":
          var rad = degToRad(-this.angleU + randInRange(this.randomnessU));
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.up, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.up, rad)
          );
          break;
        case "+":
          var rad = degToRad(this.angleU + randInRange(this.randomnessU));
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.up, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.up, rad)
          );
          break;
        case "\\":
          var rad = degToRad(-this.angleH + randInRange(this.randomnessH));
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.dir, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.dir, rad)
          );
          break;
        case "/":
          var rad = degToRad(this.angleH + randInRange(this.randomnessH));
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.dir, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(this.dir, rad)
          );
          break;
        case "^":
          var rad = degToRad(-this.angleL + randInRange(this.randomnessL));
          var right = this.dir.clone().cross(this.up);
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(right, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(right, rad)
          );
          break;
        case "&":
          var rad = degToRad(this.angleL + +randInRange(this.randomnessL));
          var right = this.dir.clone().cross(this.up);
          this.dir.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(right, rad)
          );
          this.up.applyMatrix4(
            new THREE.Matrix4().makeRotationAxis(right, rad)
          );
          break;
        case "$":
          this.up = this.dir
            .clone()
            .cross(new THREE.Vector3(0, 1, 0).cross(this.dir));
          break;
        case "[":
          this.stack.push({
            pos: this.pos.clone(),
            dir: this.dir.clone(),
            up: this.up.clone(),
          });
          break;
        case "]":
          this.popStack();
          break;
        case "%":
          //prune this branch
          //example: aaa[asdadasd[aa[dsd%a[s]da]bbb]ccc]asdadasd
          var ctr = 0;
          while (++this.currIndex < cmd.length && ctr != -1) {
            if (cmd[this.currIndex] == "[") {
              ctr++;
            }
            if (cmd[this.currIndex] == "]") {
              ctr--;
            }
          }
          this.currIndex--; //to compensate for the idx increment that happens right after all the switch cases
          this.popStack();
          break;
        default:
          // console.log("Wrong symbol found: " + cmd[this.currIndex]);
          break;
      }
      this.currIndex++;
    }
    this.draw();
  },
  reset: function () {
    this.pos = this._opts.pos.clone();
    this.dir = this._opts.dir.clone();
    this.up = this._opts.up.clone();
    this.vertices = [];
    this.segments = [];
  },
  clear: function () {
    this.reset();
    while (this.sceneChildren.length > 0) {
      var sceneChild = this.sceneChildren.pop();
      this.scene.remove(sceneChild);
    }
  },
  setPos: function (vec) {
    this.pos = vec;
    this._opts.pos = this.pos.clone();
    return this;
  },
  addSegment: function (p1, p2, replacePrev) {
    if (replacePrev) this.segments[this.segments.length - 1][1] = p2;
    else this.segments.push([p1, p2]);

    if (replacePrev) {
      this.vertices.pop();
      this.vertices.push(p2);
    } else {
      this.vertices.push(p1);
      this.vertices.push(p2);
    }
  },
  addLeaf: function () {
    const leaf = {
      pos: this.pos.clone(),
      dir: this.dir.clone(),
      up: this.up.clone(),
    };
    this.leaves.push(leaf);
  },
  draw: function () {
    this.drawSegments();
    this.drawLeaves();
  },
  drawSegments: function () {
    const lineMaterial = new MeshLineMaterial({
      useMap: false,
      color: this.lineColor,
      resolution: new THREE.Vector2(1024, 1024), // TODO canvas width, height
      sizeAttenuation: false,
      lineWidth: this.lineWidth,
    });

    this.segments.forEach((segment, i) => {
      const geometry = new THREE.Geometry();
      geometry.vertices.push(segment[0]);
      geometry.vertices.push(segment[1]);
      const line = new MeshLine();
      line.setGeometry(geometry);
      const meshLine = new THREE.Mesh(line, lineMaterial);
      this.scene.add(meshLine);
      this.sceneChildren.push(meshLine);
    });
  },
  drawLeaves: function () {
    // console.log(this.leaves);
  },
  popStack: function () {
    var top = this.stack.pop();
    this.pos = top.pos;
    this.dir = top.dir;
    this.up = top.up;
  },
};

export default Turtle;
