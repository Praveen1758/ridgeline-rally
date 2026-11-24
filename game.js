"use strict";
const $ = (id) => document.getElementById(id);
const paths = {
  flag: "M4 21V3m0 1c5-4 9 4 16 0v10c-7 4-11-4-16 0m5-10v5h5V5m0 4v5m-10-5h5v4",
  wrench: "M14 4a6 6 0 0 0-7 7L2 17l4 4 6-6a6 6 0 0 0 8-8l-4 4-4-4 4-4z",
  map: "m2 5 6-2 8 3 6-2v15l-6 2-8-3-6 2zm6-2v15m8-12v15",
  sound: "M3 9h4l5-5v16l-5-5H3zm13-2c3 2 3 8 0 10m3-13c5 4 5 12 0 16",
  mute: "M3 9h4l5-5v16l-5-5H3zm13 0 6 6m0-6-6 6",
  help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 2v1M12 2a10 10 0 1 0 .01 0",
  trophy:
    "M7 3h10v6c0 5-2 7-5 7s-5-2-5-7zm0 2H3v3c0 3 2 5 5 5m9-8h4v3c0 3-2 5-5 5m-4 3v4m-5 1h10",
  fuel: "M4 21V3h10v18m-12 0h14M6 6h6v5H6zm9 4h2l1 2v5c0 2 3 2 3 0V9l-4-5",
  distance: "M2 17 8 7l4 6 3-4 7 8zM7 10l2 1m6 1 2 1",
  play: "M5 2v20l16-10z",
  pause: "M5 4h4v16H5zm10 0h4v16h-4z",
  keyboard:
    "M2 5h20v14H2zm3 4h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1m-10 3h8",
  car: "M2 16V9h6l2-4h5l3 4h3v7h-2m-5 0H8m-4-1a2 2 0 1 0 4 0 2 2 0 1 0-4 0m11 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
};
function icon(n) {
  return (
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="' +
    (["play", "pause"].includes(n) ? "currentColor" : "none") +
    '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' +
    paths[n] +
    '"/></svg>'
  );
}
document
  .querySelectorAll("[data-i]")
  .forEach((e) => (e.innerHTML = icon(e.dataset.i)));
{
  const g = $("logo").getContext("2d");
  ART.rect(g, 31, 1, 10, 10, "#ffbb58");
  ART.poly(
    g,
    [
      [0, 29],
      [15, 9],
      [21, 16],
      [29, 5],
      [49, 30],
    ],
    "#ffb451",
  );
  ART.poly(
    g,
    [
      [6, 27],
      [15, 15],
      [20, 20],
      [27, 13],
      [31, 16],
      [37, 17],
      [44, 27],
    ],
    "#272b2a",
  );
  ART.poly(
    g,
    [
      [12, 24],
      [16, 18],
      [21, 23],
      [29, 12],
      [35, 19],
      [29, 16],
      [21, 28],
    ],
    "#f3e9ce",
  );
  ART.rect(g, 6, 31, 37, 2, "#ad7443");
}
const tracks = [
  { name: "Copper Canyon", length: 650, grade: "Rolling hills" },
  { name: "Dusk Ridge", length: 850, grade: "Steep climbs" },
  { name: "Alpine Crest", length: 1000, grade: "Technical terrain" },
];
const upgrades = [
  ["engine", "Engine", "More torque on steep climbs"],
  ["grip", "Tires", "More grip and landing stability"],
  ["tank", "Fuel tank", "More time between fuel stops"],
];
let save = {
  bank: 0,
  stage: 0,
  best: [0, 0, 0],
  engine: 0,
  grip: 0,
  tank: 0,
  sound: true,
};
try {
  Object.assign(
    save,
    JSON.parse(localStorage.getItem("ridgeline-rally-v1")) || {},
  );
} catch {}
const persist = () => {
  try {
    localStorage.setItem("ridgeline-rally-v1", JSON.stringify(save));
  } catch {}
};
const startX = 145,
  pxm = 9,
  track = () => tracks[save.stage];
function ground(x) {
  let t = x - startX;
  return (
    122 +
    22 * Math.sin(t / 92 + 0.1) +
    16 * Math.sin(t / 52 + 0.5) +
    save.stage * (13 * Math.sin(t / 65) + 8 * Math.sin(t / 38)) +
    Math.min(1, Math.max(0, t / 650)) *
      (22 * Math.sin(t / 157) + 12 * Math.sin(t / 35))
  );
}
let car,
  mode = "ready",
  distance = 0,
  furthest = 0,
  runCoins = 0,
  taken = new Set(),
  elapsed = 0,
  w = 600,
  h = 230,
  cx = 0,
  cy = 0,
  spin = 0,
  grace = 0,
  toastTime = 0,
  activeDialog = "",
  resumeOnClose = false;
const inputs = { gas: new Set(), brake: new Set() };
let ctx, osc, volume;
function soundInit() {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      osc = ctx.createOscillator();
      volume = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 47;
      volume.gain.value = 0;
      osc.connect(volume);
      volume.connect(ctx.destination);
      osc.start();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  } catch {}
}
function ping(freq, len = 0.12) {
  if (!ctx || !save.sound) return;
  const o = ctx.createOscillator(),
    a = ctx.createGain();
  o.type = "square";
  o.frequency.value = freq;
  a.gain.setValueAtTime(0.032, ctx.currentTime);
  a.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
  o.connect(a);
  a.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + len);
}
function motor() {
  if (ctx) {
    volume.gain.setTargetAtTime(
      mode === "running" && save.sound ? 0.028 : 0,
      ctx.currentTime,
      0.05,
    );
    osc.frequency.setTargetAtTime(
      38 + Math.abs(car.vx) * 0.36 + (inputs.gas.size ? 12 : 0),
      ctx.currentTime,
      0.07,
    );
  }
}
function updateSound() {
  let a = $("audio");
  a.innerHTML = icon(save.sound ? "sound" : "mute");
  a.setAttribute("aria-label", save.sound ? "Mute sound" : "Enable sound");
  a.setAttribute("aria-pressed", String(save.sound));
}
$("audio").onclick = () => {
  soundInit();
  save.sound = !save.sound;
  persist();
  updateSound();
  motor();
};
updateSound();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
const app = new PIXI.Application({
  width: w,
  height: h,
  forceCanvas: true,
  antialias: false,
  backgroundColor: 0x94d0d3,
  roundPixels: true,
});
$("world").append(app.view);
app.view.setAttribute(
  "aria-label",
  "Side view of your rally pickup on the hill-climb course",
);
function sprite(canvas) {
  let s = PIXI.Sprite.from(canvas);
  s.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return s;
}
const skyLayer = new PIXI.Container(),
  terrainLayer = new PIXI.Container(),
  objects = new PIXI.Container(),
  vehicle = new PIXI.Container();
app.stage.addChild(skyLayer, terrainLayer, objects, vehicle);
const truck = sprite(ART.truck());
truck.position.set(-38, -30);
vehicle.addChild(truck);
let wheels = [-21, 21].map((x) => {
  let wh = sprite(ART.wheel());
  wh.anchor.set(0.5);
  wh.position.set(x, 3);
  vehicle.addChild(wh);
  return wh;
});
const tiles = new Map(),
  pickupSprites = new Map();
let mountains = [];
function clearTiles() {
  for (let s of tiles.values()) s.destroy({ texture: true, baseTexture: true });
  tiles.clear();
  for (let s of pickupSprites.values()) s.destroy();
  pickupSprites.clear();
}
function resize() {
  const box = $("screen").getBoundingClientRect(),
    scale = Math.max(1.55, Math.min(2.6, box.height / 200));
  w = Math.max(130, Math.round(box.width / scale));
  h = Math.round(box.height / scale);
  app.renderer.resize(w, h);
  const old = skyLayer.removeChildren();
  for (const s of old) s.destroy({ texture: true, baseTexture: true });
  skyLayer.addChild(sprite(ART.sky(w, h, ART.palettes[save.stage])));
  mountains = [0, 1].map((i) => {
    const tex = PIXI.Texture.from(ART.mesas(h, save.stage, i));
    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const s = new PIXI.TilingSprite(tex, w, h);
    skyLayer.addChild(s);
    return s;
  });
  draw(true);
}
function itemTexture(kind) {
  const c = ART.canvas(
      kind === "finish" ? 30 : 16,
      kind === "finish" ? 45 : 18,
    ),
    g = c.getContext("2d"),
    r = (x, y, w, h, col) => ART.rect(g, x, y, w, h, col);
  if (kind === "coin") {
    for (const [x, y, w, h, col] of [
      [3, 1, 10, 16, "#97531f"],
      [1, 4, 14, 10, "#97531f"],
      [4, 1, 7, 14, "#ffcc3c"],
      [2, 4, 11, 8, "#ffcc3c"],
      [4, 2, 7, 2, "#fff2a0"],
      [3, 4, 2, 7, "#ffe17b"],
      [7, 5, 3, 7, "#dc8c20"],
      [7, 4, 2, 7, "#fff396"],
      [5, 14, 6, 1, "#e59925"],
    ])
      r(x, y, w, h, col);
  } else if (kind === "fuel") {
    r(2, 5, 13, 12, "#6d3d31");
    r(3, 6, 11, 10, "#df5434");
    r(5, 1, 7, 5, "#703932");
    r(7, 2, 3, 2, "#bdd0b9");
    r(11, 3, 4, 2, "#433a35");
    r(7, 8, 3, 6, "#ffe5aa");
    r(5, 10, 7, 2, "#ffe5aa");
  } else {
    r(1, 0, 2, 45, "#453a33");
    r(3, 1, 24, 16, "#f3e5c7");
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 6; i++)
        if ((i + j) % 2 === 0) r(3 + i * 4, 1 + j * 4, 4, 4, "#3c3935");
  }
  return PIXI.Texture.from(c);
}
const itemTex = Object.fromEntries(
  ["coin", "fuel", "finish"].map((k) => [k, itemTexture(k)]),
);
function itemsIn(a, b) {
  const list = [],
    end = startX + track().length * pxm;
  for (
    let group = Math.max(0, Math.floor((a - 380) / 245));
    group <= Math.ceil(b / 245);
    group++
  ) {
    for (let j = 0; j < 4; j++) {
      let x = startX + 105 + group * 245 + j * 20;
      if (x >= a && x <= b && x < end - 30)
        list.push({
          id: "c" + group + "-" + j,
          x,
          y: ground(x) - 23 - Math.sin((j * Math.PI) / 3) * 6,
          kind: "coin",
        });
    }
  }
  for (
    let k = Math.max(1, Math.floor((a - startX) / 760));
    startX + k * 760 <= b;
    k++
  ) {
    let x = startX + k * 760;
    if (x >= a && x < end)
      list.push({ id: "f" + k, x, y: ground(x) - 17, kind: "fuel" });
  }
  if (end >= a && end <= b)
    list.push({ id: "end", x: end, y: ground(end) - 22, kind: "finish" });
  return list;
}
function draw(snap = false) {
  if (!car) return;
  const tx = car.x - Math.min(w * 0.29, 175),
    ty = ground(car.x) - h * 0.74;
  cx = snap ? tx : cx + (tx - cx) * 0.16;
  cy = snap ? ty : cy + (ty - cy) * 0.08;
  const x0 = Math.round(cx),
    y0 = Math.round(cy);
  mountains.forEach(
    (s, i) => (s.tilePosition.x = Math.round(-(x0 + 55) * (0.1 + i * 0.14))),
  );
  terrainLayer.position.set(-x0, -y0);
  let lo = Math.floor(x0 / 256),
    hi = Math.floor((x0 + w) / 256);
  for (let i = lo; i <= hi; i++)
    if (!tiles.has(i)) {
      let s = sprite(ART.tile(i * 256, 540, ground, save.stage));
      s.x = i * 256;
      terrainLayer.addChild(s);
      tiles.set(i, s);
    }
  for (const [i, s] of tiles)
    if (i < lo || i > hi) {
      s.destroy({ texture: true, baseTexture: true });
      tiles.delete(i);
    }
  const visible = new Set();
  for (const it of itemsIn(x0 - 20, x0 + w + 20)) {
    if (taken.has(it.id)) continue;
    visible.add(it.id);
    let s = pickupSprites.get(it.id);
    if (!s) {
      s = new PIXI.Sprite(itemTex[it.kind]);
      s.anchor.set(0.5);
      objects.addChild(s);
      pickupSprites.set(it.id, s);
    }
    s.position.set(
      Math.round(it.x - x0),
      Math.round(
        it.y -
          y0 +
          (it.kind === "coin" ? Math.sin(elapsed * 3 + it.x * 0.02) * 1.3 : 0),
      ),
    );
  }
  for (const [id, s] of pickupSprites)
    if (!visible.has(id)) {
      s.destroy();
      pickupSprites.delete(id);
    }
  vehicle.position.set(Math.round(car.x - x0), Math.round(car.y - y0));
  vehicle.rotation = car.angle;
  wheels.forEach((wh) => (wh.rotation = spin));
}
let renderedMode;
function syncHud() {
  const fields = {
    stageTitle: track().name,
    stageNo: "STAGE 0" + (save.stage + 1),
    best: save.best[save.stage],
    distance,
    coins: runCoins,
  };
  for (const [id, value] of Object.entries(fields)) {
    const node = $(id);
    if (node.textContent !== String(value)) node.textContent = value;
  }
  const fuel = Math.round(car.fuel),
    meter = $("fuelmeter");
  if (
    meter.getAttribute("aria-valuenow") !== String(fuel) ||
    !meter.dataset.ready
  ) {
    [...meter.children].forEach((s, i) =>
      s.classList.toggle("empty", i >= Math.ceil(car.fuel / 10)),
    );
    meter.setAttribute("aria-valuenow", fuel);
    meter.dataset.ready = "true";
  }
  if (renderedMode !== mode) {
    $("action").innerHTML =
      icon(mode === "running" ? "pause" : "play") +
      "<span>" +
      {
        ready: "START ENGINE",
        running: "PAUSE",
        paused: "RESUME",
        over: "RACE AGAIN",
      }[mode] +
      "</span>";
    renderedMode = mode;
  }
}
for (let i = 0; i < 10; i++)
  $("fuelmeter").append(document.createElement("span"));
function release() {
  for (let k of ["gas", "brake"]) {
    inputs[k].clear();
    $(k).classList.remove("down");
  }
}
function reset() {
  release();
  car = {
    x: startX,
    y: ground(startX) - 12,
    vx: 0,
    vy: 0,
    angle: Math.atan((ground(startX + 21) - ground(startX - 21)) / 42),
    omega: 0,
    fuel: 100,
  };
  distance = 0;
  furthest = 0;
  runCoins = 0;
  taken.clear();
  mode = "ready";
  elapsed = 0;
  grace = 0;
  spin = 0;
  $("feedback").textContent = "";
  clearTiles();
  syncHud();
  draw(true);
  motor();
}
function start() {
  soundInit();
  if (mode === "over") reset();
  mode = "running";
  syncHud();
  motor();
}
function pause() {
  if (mode === "running") {
    mode = "paused";
    release();
    syncHud();
    motor();
  }
}
function checkpoint() {
  if (furthest > save.best[save.stage]) {
    save.best[save.stage] = furthest;
    persist();
  }
}
function finish(reason) {
  mode = "over";
  release();
  checkpoint();
  if (reason === "Finish line!") {
    save.bank += 50;
    persist();
    ping(840, 0.25);
  } else ping(130, 0.2);
  syncHud();
  motor();
  openDialog("result", reason);
}
function step(dt) {
  const gas = Number(inputs.gas.size > 0),
    brake = Number(inputs.brake.size > 0),
    c = car,
    cs = Math.cos(c.angle),
    sn = Math.sin(c.angle);
  let forceY = 244,
    torque = 0,
    traction = 0,
    slope = 0;
  for (let dx of [-21, 21]) {
    let ax = dx * cs - 3 * sn,
      ay = dx * sn + 3 * cs,
      wx = c.x + ax,
      wy = c.y + ay,
      pen = wy + 9 - ground(wx);
    if (pen > 0) {
      let m = (ground(wx + 1) - ground(wx - 1)) / 2;
      let compressionRate = c.vy + c.omega * ax - m * c.vx;
      let spring = Math.min(
        1150,
        Math.max(0, pen * 115 + compressionRate * (11 + save.grip)),
      );
      forceY -= spring;
      torque -= (spring * ax) / 490;
      traction++;
      slope += m;
    }
  }
  let accel = -c.vx * 0.13;
  if (traction) {
    slope /= traction;
    accel +=
      gas * (75 + save.engine * 14) -
      brake * (c.vx > 3 ? 148 : 42) +
      (slope * 112) / (1 + slope * slope);
    if (!gas && !brake) accel -= c.vx * 0.35;
    torque -= c.omega * (3 + save.grip * 0.4);
  } else {
    torque += (brake - gas) * 6.4 - c.omega * 0.65;
  }
  c.vx = Math.max(-37, Math.min(159 + save.engine * 15, c.vx + accel * dt));
  c.vy += forceY * dt;
  c.omega = Math.max(-5, Math.min(5, c.omega + torque * dt));
  c.x = Math.max(startX - 25, c.x + c.vx * dt);
  c.y += c.vy * dt;
  c.angle += c.omega * dt;
  spin += (c.vx * dt) / 9;
  elapsed += dt;
  c.fuel = Math.max(
    0,
    c.fuel - (dt * (1.38 + gas * 0.64)) / (1 + save.tank * 0.22),
  );
  distance = Math.max(0, Math.floor((c.x - startX) / pxm));
  furthest = Math.max(furthest, distance);
  for (const it of itemsIn(c.x - 31, c.x + 31)) {
    if (it.kind === "finish" || taken.has(it.id) || Math.abs(c.y - it.y) > 27)
      continue;
    taken.add(it.id);
    if (it.kind === "coin") {
      runCoins++;
      save.bank++;
      persist();
      ping(720);
    } else {
      c.fuel = 100;
      toast("TANK FILLED");
      ping(510, 0.2);
    }
  }
  const roofX = c.x + 17 * Math.sin(c.angle),
    roofY = c.y - 17 * Math.cos(c.angle);
  grace =
    roofY >= ground(roofX) - 1 && Math.cos(c.angle) < 0.3 ? grace + dt : 0;
  if (grace > 0.1 || c.y > ground(c.x) + 35) finish("Rolled over");
  else if (c.fuel <= 0) finish("Out of fuel");
  else if (distance >= track().length) finish("Finish line!");
}
function toast(s) {
  $("feedback").textContent = s;
  toastTime = elapsed + 1.1;
}
let acc = 0,
  hudTime = 0;
app.ticker.add(() => {
  if (mode !== "running") {
    acc = 0;
    return;
  }
  acc += Math.min(app.ticker.deltaMS / 1000, 0.08);
  while (acc >= 1 / 120 && mode === "running") {
    step(1 / 120);
    acc -= 1 / 120;
  }
  draw();
  if (elapsed > toastTime) $("feedback").textContent = "";
  if (elapsed - hudTime > 0.09 || elapsed < hudTime) {
    syncHud();
    hudTime = elapsed;
    motor();
  }
});
function trigger(k, token, down) {
  if (down) {
    if ($("modal").open) return;
    if (mode === "ready") start();
    if (mode !== "running") return;
    inputs[k].add(token);
  } else inputs[k].delete(token);
  $(k).classList.toggle("down", inputs[k].size > 0);
}
for (const k of ["brake", "gas"]) {
  const b = $(k);
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    trigger(k, e.pointerId, true);
  };
  b.onpointerup =
    b.onpointercancel =
    b.onlostpointercapture =
      (e) => trigger(k, e.pointerId, false);
  b.oncontextmenu = (e) => e.preventDefault();
}
function action() {
  if (mode === "running") {
    openDialog("pause");
  } else start();
}
$("action").onclick = action;
const mapping = {
  ArrowLeft: "brake",
  KeyA: "brake",
  ArrowRight: "gas",
  KeyD: "gas",
};
window.addEventListener("keydown", (e) => {
  if (
    $("modal").open &&
    activeDialog === "pause" &&
    !e.repeat &&
    e.code === "KeyP"
  ) {
    e.preventDefault();
    closeDialog();
    return;
  }
  if ($("modal").open || e.ctrlKey || e.altKey || e.metaKey) return;
  if (mapping[e.code]) {
    e.preventDefault();
    if (!e.repeat) trigger(mapping[e.code], e.code, true);
  } else if (
    !e.repeat &&
    e.code === "KeyP" &&
    ["paused", "running"].includes(mode)
  ) {
    e.preventDefault();
    action();
  } else if (!e.repeat && e.code === "KeyR") {
    e.preventDefault();
    checkpoint();
    reset();
    start();
  }
});
window.addEventListener("keyup", (e) => {
  if (mapping[e.code]) trigger(mapping[e.code], e.code, false);
});
window.addEventListener("pagehide", checkpoint);
window.addEventListener("blur", () => {
  release();
  pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    release();
    pause();
    checkpoint();
  }
});
const mb = $("modalBody"),
  modal = $("modal");
function closeDialog() {
  if (modal.open) modal.close();
  if (resumeOnClose && mode === "paused") start();
  resumeOnClose = false;
  activeDialog = "";
  $("raceTab").classList.add("active");
  $("garageTab").classList.remove("active");
  $("tracksTab").classList.remove("active");
}
modal.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});
$("close").onclick = closeDialog;
modal.onclick = (e) => {
  const r = modal.getBoundingClientRect();
  if (
    e.target === modal &&
    (e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom)
  )
    closeDialog();
};
function openDialog(type, reason) {
  if (!modal.open) {
    resumeOnClose = mode === "running";
    pause();
    modal.showModal();
  }
  activeDialog = type;
  ["race", "garage", "tracks"].forEach((t) =>
    $(t + "Tab").classList.toggle(
      "active",
      type === t || (t === "race" && !["garage", "tracks"].includes(type)),
    ),
  );
  if (type === "pause") {
    $("modalTitle").textContent = "Race paused";
    mb.innerHTML =
      "<p>" +
      track().name +
      " · " +
      distance +
      ' m</p><button class="dialogBtn" id="resumeRun">Resume race</button><button class="dialogBtn" id="restartRun">Restart race</button>';
    $("resumeRun").onclick = closeDialog;
    $("restartRun").onclick = () => {
      resumeOnClose = false;
      closeDialog();
      checkpoint();
      reset();
      start();
    };
  }
  if (type === "garage") {
    $("modalTitle").textContent = "Garage";
    mb.innerHTML = '<p class="balance">Coin balance · ' + save.bank + "</p>";
    for (const [k, name, desc] of upgrades) {
      const level = save[k],
        price = 12 * (level + 1);
      let row = document.createElement("div");
      row.className = "row";
      row.innerHTML =
        "<div><b>" +
        name +
        "</b> · " +
        level +
        "/3<small>" +
        desc +
        "</small></div><button " +
        (level >= 3 || save.bank < price ? "disabled" : "") +
        ">" +
        (level >= 3 ? "Max level" : price + " coins") +
        "</button>";
      row.querySelector("button").onclick = () => {
        if (save[k] < 3 && save.bank >= price) {
          save.bank -= price;
          save[k]++;
          persist();
          openDialog("garage");
        }
      };
      mb.append(row);
    }
  }
  if (type === "tracks") {
    $("modalTitle").textContent = "Tracks";
    mb.innerHTML = "";
    tracks.forEach((t, i) => {
      let row = document.createElement("div");
      row.className = "row";
      row.innerHTML =
        "<div><b>" +
        t.name +
        "</b><small>" +
        t.grade +
        " · " +
        t.length +
        " m</small></div><button>" +
        (save.stage === i ? "Selected" : "Race here") +
        "</button>";
      row.querySelector("button").onclick = () => {
        if (i !== save.stage) {
          checkpoint();
          save.stage = i;
          persist();
          resumeOnClose = false;
          reset();
          resize();
        }
        closeDialog();
      };
      mb.append(row);
    });
  }
  if (type === "help") {
    $("modalTitle").textContent = "How to play";
    mb.innerHTML =
      '<div class="helptext"><p>Reach the checkered flag before your tank runs dry. Pick up fuel cans to refill and collect coins to upgrade your pickup.</p><p><kbd>→</kbd> or <kbd>D</kbd> · Accelerate. In the air, hold to lift the nose.</p><p><kbd>←</kbd> or <kbd>A</kbd> · Brake or reverse. In the air, hold to lower the nose.</p><p>On touchscreens, hold the Gas and Brake pedals. Land on your wheels to keep racing.</p><p><kbd>P</kbd> Pause or resume · <kbd>R</kbd> Restart</p></div>';
  }
  if (type === "result") {
    $("modalTitle").textContent = reason;
    mb.innerHTML =
      "<p>" +
      track().name +
      '</p><div class="row">Distance <b>' +
      distance +
      ' m</b></div><div class="row">Coins collected <b>' +
      runCoins +
      "</b></div>" +
      (reason === "Finish line!"
        ? '<div class="row">Finish bonus <b>50 coins</b></div>'
        : "") +
      '<button class="dialogBtn">Race again</button>';
    mb.querySelector("button").onclick = () => {
      closeDialog();
      reset();
      start();
    };
  }
}
$("raceTab").onclick = closeDialog;
$("garageTab").onclick = () => openDialog("garage");
$("tracksTab").onclick = () => openDialog("tracks");
$("help").onclick = () => openDialog("help");
reset();
resize();
new ResizeObserver(resize).observe($("screen"));
