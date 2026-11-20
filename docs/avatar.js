// BYTE: original lightweight robot, with leaf/circuit antenna and a river motif.
// Geometry is built once; clones share geometry and materials across all AR anchors.
let prototype;

export function buildByteModel(T) {
  const root = new T.Group(); root.name = 'byte-amazonico';
  const colors = { white: '#f8f5ff', violet: '#7c3aed', lavender: '#c4b5fd', black: '#171120', face: '#160d27' };
  const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, new T.MeshStandardMaterial({
    color, roughness: 0.58, metalness: name === 'black' ? 0.2 : 0.08,
    emissive: name === 'lavender' ? '#7c3aed' : '#000000', emissiveIntensity: name === 'lavender' ? 0.22 : 0
  })]));
  const geometries = new Map();
  const cached = (key, create) => { if (!geometries.has(key)) geometries.set(key, create()); return geometries.get(key); };
  function mesh(geometry, material, parent, position = [0, 0, 0], scale = [1, 1, 1], name = '') {
    const object = new T.Mesh(geometry, materials[material]); object.position.set(...position); object.scale.set(...scale); object.name = name; parent.add(object); return object;
  }
  function roundedGeometry(w, h, d, r) {
    return cached(`rounded:${w}:${h}:${d}:${r}`, () => {
      const s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSegments: 1, steps: 1,
        bevelSize: Math.min(0.018, d / 3), bevelThickness: Math.min(0.015, d / 3), curveSegments: 4 });
      g.translate(0, 0, -d / 2); return g;
    });
  }
  function box(w, h, d, r, material, parent, pos, name) { return mesh(roundedGeometry(w, h, d, r), material, parent, pos, [1, 1, 1], name); }
  function ball(radius, material, parent, pos, scale = [1, 1, 1], name = '') {
    return mesh(cached(`sphere:${radius}`, () => new T.SphereGeometry(radius, 12, 8)), material, parent, pos, scale, name);
  }
  function cylinder(radius, height, material, parent, pos, name = '') {
    return mesh(cached(`cylinder:${radius}:${height}`, () => new T.CylinderGeometry(radius, radius, height, 12)), material, parent, pos, [1, 1, 1], name);
  }
  function stroke(points, radius, material, parent, name = '') {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    const geometry = new T.TubeGeometry(curve, Math.max(6, points.length * 3), radius, 5, false);
    return mesh(geometry, material, parent, [0, 0, 0], [1, 1, 1], name);
  }
  function leaf(material, parent, position, scale = 1, rotation = 0, name = '') {
    const geometry = cached('leaf', () => {
      const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(-0.15, 0.13, 0, 0.3); s.quadraticCurveTo(0.15, 0.13, 0, 0);
      const g = new T.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -0.009); return g;
    });
    const group = new T.Group(); group.name = name; group.position.set(...position); group.scale.setScalar(scale); group.rotation.z = rotation;
    parent.add(group); mesh(geometry, material, group);
    stroke([[0, 0.035, 0.016], [0.015, 0.13, 0.016], [0, 0.255, 0.016]], 0.007, 'white', group);
    return group;
  }

  // Main silhouette: rounded ceramic helmet, dark screen, short articulated body.
  box(0.56, 0.46, 0.34, 0.13, 'black', root, [0, 0.08, 0], 'torso');
  box(0.52, 0.16, 0.37, 0.065, 'violet', root, [0, -0.2, 0], 'river-band');
  cylinder(0.075, 0.12, 'black', root, [0, 0.39, 0]);
  box(0.84, 0.57, 0.4, 0.2, 'white', root, [0, 0.75, 0], 'helmet');
  box(0.68, 0.36, 0.055, 0.14, 'face', root, [0, 0.75, 0.228], 'face-screen');
  for (const sign of [-1, 1]) {
    const ear = cylinder(0.14, 0.07, 'violet', root, [sign * 0.45, 0.75, 0]); ear.rotation.z = Math.PI / 2;
    const ring = mesh(cached('ear-ring', () => new T.TorusGeometry(0.112, 0.016, 5, 16)), 'lavender', root, [sign * 0.49, 0.75, 0]); ring.rotation.y = Math.PI / 2;
  }
  const eyes = new T.Group(); eyes.name = 'eyes'; eyes.position.set(0, 0.76, 0.29); root.add(eyes);
  for (const x of [-0.145, 0.145]) stroke([[x - 0.065, 0, 0], [x - 0.045, 0.06, 0], [x, 0.082, 0], [x + 0.045, 0.06, 0], [x + 0.065, 0, 0]], 0.014, 'lavender', eyes);
  const smile = new T.Shape(); smile.moveTo(-0.08, 0); smile.lineTo(0.08, 0); smile.quadraticCurveTo(0.06, -0.085, 0, -0.085); smile.quadraticCurveTo(-0.06, -0.085, -0.08, 0);
  mesh(new T.ShapeGeometry(smile, 8), 'lavender', root, [0, 0.69, 0.29], [1, 1, 1], 'smile');

  // Two organic leaves grow from a split circuit stem; no external textures.
  const antenna = new T.Group(); antenna.name = 'leaf-antenna'; root.add(antenna);
  stroke([[-0.04, 1.04, 0], [-0.04, 1.12, 0], [-0.11, 1.18, 0]], 0.014, 'violet', antenna);
  stroke([[0.035, 1.04, 0], [0.035, 1.12, 0], [0.11, 1.15, 0]], 0.012, 'lavender', antenna);
  leaf('violet', antenna, [-0.11, 1.17, 0], 0.85, 0.65, 'antenna-leaf-left');
  leaf('lavender', antenna, [0.11, 1.14, 0], 0.66, -0.65, 'antenna-leaf-right');

  // Programming identity: physical </> strokes on the chest.
  const z = 0.193;
  stroke([[-0.1, 0.17, z], [-0.17, 0.11, z], [-0.1, 0.05, z]], 0.014, 'white', root, 'code-left');
  stroke([[0.027, 0.19, z], [-0.027, 0.03, z]], 0.014, 'white', root, 'code-slash');
  stroke([[0.1, 0.17, z], [0.17, 0.11, z], [0.1, 0.05, z]], 0.014, 'white', root, 'code-right');
  stroke([[-0.22, -0.19, 0.205], [-0.1, -0.16, 0.205], [0.025, -0.21, 0.205], [0.14, -0.18, 0.205], [0.22, -0.15, 0.205]], 0.012, 'lavender', root, 'river-upper');
  stroke([[-0.02, -0.21, 0.205], [0.1, -0.245, 0.205], [0.22, -0.215, 0.205]], 0.009, 'lavender', root, 'river-lower');
  ball(0.022, 'white', root, [0.22, -0.15, 0.211]); ball(0.018, 'lavender', root, [0.22, -0.215, 0.211]);
  box(0.37, 0.38, 0.17, 0.08, 'violet', root, [0, 0.11, -0.25], 'utility-backpack');

  for (const [side, sign] of [['left', -1], ['right', 1]]) {
    const arm = new T.Group(); arm.name = `arm-${side}`; arm.position.set(sign * 0.35, 0.22, 0); root.add(arm);
    ball(0.115, 'violet', arm, [0, 0, 0], [1, 0.95, 1]);
    cylinder(0.06, 0.15, 'black', arm, [0, -0.13, 0]);
    box(0.145, 0.2, 0.15, 0.05, 'white', arm, [0, -0.26, 0]);
    ball(0.07, 'black', arm, [0, -0.365, 0]);
    box(0.155, 0.13, 0.105, 0.045, 'white', arm, [0, -0.46, 0.01], `hand-${side}`);
    for (let finger = 0; finger < 3; finger++) ball(0.029, 'white', arm, [(finger - 1) * 0.045, -0.545, 0.012], [0.75, 1.6, 0.8]);
    ball(0.036, 'white', arm, [sign * 0.102, -0.44, 0.015], [0.9, 1.25, 0.9]);
    if (side === 'left') leaf('white', arm, [0.015, 0.01, 0.112], 0.24, -0.65, 'shoulder-leaf');
    arm.rotation.z = side === 'right' ? 2.3 : -0.15;
    const leg = new T.Group(); leg.name = `leg-${side}`; leg.position.set(sign * 0.155, -0.29, 0); root.add(leg);
    cylinder(0.065, 0.18, 'black', leg, [0, -0.08, 0]);
    box(0.18, 0.2, 0.18, 0.045, 'white', leg, [0, -0.23, 0]);
    box(0.215, 0.11, 0.29, 0.05, 'violet', leg, [0, -0.375, 0.05], `shoe-${side}`);
  }
  root.userData.identity = 'Byte — tecnología con raíces amazónicas';
  return root;
}

function registerByte() {
  if (AFRAME.components['byte-amazonico']) return;
  const T = AFRAME.THREE;
  AFRAME.registerComponent('byte-amazonico', {
    init() {
      if (!prototype) prototype = buildByteModel(T);
      this.model = prototype.clone(true); this.el.setObject3D('byte', this.model);
      this.rightArm = this.model.getObjectByName('arm-right'); this.leftArm = this.model.getObjectByName('arm-left');
      this.rightLeg = this.model.getObjectByName('leg-right'); this.leftLeg = this.model.getObjectByName('leg-left');
      this.eyes = this.model.getObjectByName('eyes'); this.mouth = this.model.getObjectByName('smile'); this.antenna = this.model.getObjectByName('leaf-antenna');
      this.last = new T.Vector3(); this.last.copy(this.el.parentEl.object3D.position);
      this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.walkUntil = 0;
    },
    tick(time) {
      if (!this.el.object3D.visible || !this.el.parentEl.object3D.visible) return;
      const parent = this.el.parentEl.object3D.position;
      if (parent.distanceToSquared(this.last) > 0.000001) this.walkUntil = time + 120;
      this.last.copy(parent);
      const moving = time < this.walkUntil, t = time / 1000;
      if (this.reducedMotion) { this.model.position.y = 0; return; }
      this.model.position.y = 0.025 + (moving ? Math.sin(t * 11) * 0.015 : 0);
      this.leftArm.rotation.z = -0.15 + (moving ? Math.sin(t * 10) * 0.18 : Math.sin(t * 2) * 0.025);
      this.rightArm.rotation.z = moving ? 0.18 + Math.sin(t * 10 + Math.PI) * 0.18 : 2.3 + Math.sin(t * 4) * 0.14;
      this.leftLeg.rotation.x = moving ? Math.sin(t * 10) * 0.3 : 0;
      this.rightLeg.rotation.x = moving ? Math.sin(t * 10 + Math.PI) * 0.3 : 0;
      this.antenna.rotation.z = Math.sin(t * 2.3) * 0.018;
      this.mouth.scale.y = window.speechSynthesis?.speaking ? 0.8 + Math.sin(t * 14) * 0.25 : 1;
      const blink = time % 4800; this.eyes.scale.y = blink < 140 ? Math.max(0.06, Math.abs(blink - 70) / 70) : 1;
    },
    remove() {
      // Geometry/materials are shared by all anchors, so they live for this page session.
      this.el.removeObject3D('byte');
    }
  });
}

export function avatarMarkup() {
  registerByte();
  return '<a-entity class="avatar-shape" byte-amazonico position="0 0.04 0" scale="0.65 0.65 0.65"></a-entity>';
}
