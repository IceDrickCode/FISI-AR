// MindAR owns the raw anchor matrix. Display a separate, filtered scene anchor.
// Distances below are fractions of the physical target width, independent of resolution.
export class StablePose {
  constructor(T) {
    this.T = T;
    this.matrix = new T.Matrix4();
    this.position = new T.Vector3(); this.rotation = new T.Quaternion(); this.scale = new T.Vector3();
    this.p = new T.Vector3(); this.q = new T.Quaternion(); this.s = new T.Vector3();
    this.reset();
  }
  reset() {
    this.history = []; this.ready = false; this.lastGood = -Infinity; this.started = null; this.lastTick = null; this.lostSince = null; this.badSince = null;
  }
  sample(matrix, now) {
    if (now - this.lastGood > 2500) this.reset();
    const reject = () => { this.badSince ??= now; return false; };
    if (!matrix.elements.every(Number.isFinite) || matrix.determinant() <= 0) return reject();
    matrix.decompose(this.p, this.q, this.s);
    if (![...this.p, ...this.q, ...this.s].every(Number.isFinite) || this.s.x <= 0 || this.s.y <= 0 || this.s.z <= 0 || this.p.z >= -0.01) return reject();
    const previous = this.history.at(-1), width = this.s.x;
    // Reject a bad pose instead of animating a flight across the camera view.
    if (previous && (this.p.distanceTo(previous.p) / width > 0.4 || this.q.angleTo(previous.q) > 0.8 || Math.abs(Math.log(width / previous.s.x)) > 0.3)) return reject();
    this.badSince = null;
    this.started ??= now;
    this.lastGood = now;
    this.history.push({ p: this.p.clone(), q: this.q.clone(), s: this.s.clone() });
    if (this.history.length > 5) this.history.shift();
    this.targetP = this.p.clone();
    for (const axis of ['x', 'y', 'z']) this.targetP[axis] = this.history.map(v => v.p[axis]).sort((a, b) => a - b)[Math.floor(this.history.length / 2)];
    this.targetQ = this.q.clone(); this.targetS = this.s.clone();
    if (!this.ready && this.history.length >= 4 && now - this.started >= 140) {
      this.ready = true;
      this.position.copy(this.targetP); this.rotation.copy(this.targetQ); this.scale.copy(this.targetS);
    }
    return true;
  }
  tick(now, observed = true) {
    if (observed) this.lostSince = null;
    else this.lostSince ??= now;
    // Camera inference may be slower than rendering. A visible raw anchor with
    // no new sample is different from a lost target or a rejected pose.
    if (now - this.lastGood > 2500 || (this.lostSince !== null && now - this.lostSince > 180) || (this.badSince !== null && now - this.badSince > 180)) { this.reset(); return false; }
    if (!this.ready) return false;
    const dt = Math.min(50, Math.max(0, now - (this.lastTick ?? now)));
    this.lastTick = now;
    const alpha = 1 - Math.exp(-dt / 110);
    if (this.position.distanceTo(this.targetP) > this.scale.x * 0.003) this.position.lerp(this.targetP, alpha);
    if (this.rotation.angleTo(this.targetQ) > 0.006) this.rotation.slerp(this.targetQ, alpha);
    if (this.scale.distanceTo(this.targetS) > this.scale.x * 0.003) this.scale.lerp(this.targetS, alpha);
    this.matrix.compose(this.position, this.rotation, this.scale);
    return true;
  }
}

// Hold the current identity through brief losses; don't alternate rooms on single detections.
export class TargetLock {
  constructor() { this.active = null; }
  select(visible) {
    if (visible.includes(this.active)) return this.active;
    this.active = visible[0] ?? null;
    return this.active;
  }
}
