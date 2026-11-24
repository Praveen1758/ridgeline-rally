// Pixel-art textures are drawn at their native resolution and scaled by PixiJS.
const ART = (() => {
  const palettes = [
    {
      sky: ["#81c9d4", "#9ed5d7", "#b8dfd9", "#d8e6d2", "#efdfbd"],
      far: ["#e9b9a0", "#d7a18e", "#c58a79"],
      near: ["#d78a62", "#bb6950", "#a45a47", "#e69e72"],
      ground: [
        "#f6bd75",
        "#da9353",
        "#bf7445",
        "#9e5b3e",
        "#754638",
        "#573b33",
      ],
      plant: ["#396a57", "#538365", "#7c9a69"],
    },
    {
      sky: ["#9197ce", "#b7afd8", "#d4bed8", "#ebc9d6", "#ffdfc7"],
      far: ["#ccb0bd", "#b799b0", "#957f9e"],
      near: ["#a47887", "#8b657b", "#765872", "#bf939b"],
      ground: [
        "#e0b691",
        "#b48a81",
        "#9c7077",
        "#805b65",
        "#694d59",
        "#483f4e",
      ],
      plant: ["#395c5b", "#527774", "#709892"],
    },
    {
      sky: ["#86bfd1", "#a5cedb", "#b7d7dd", "#d7e5df", "#f0ecdb"],
      far: ["#bad1cf", "#a1b9bb", "#869faa"],
      near: ["#96abaa", "#768d94", "#627882", "#d5e0d7"],
      ground: [
        "#e9f3e8",
        "#aabbb7",
        "#8e9f9e",
        "#72868b",
        "#576b72",
        "#40575f",
      ],
      plant: ["#385951", "#54796a", "#7c9b84"],
    },
  ];
  const canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  function rect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }
  function poly(g, pts, c) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y < Math.max(...ys); y++) {
      let cuts = [];
      for (let j = 0; j < pts.length; j++) {
        const a = pts[j],
          b = pts[(j + 1) % pts.length];
        if ((a[1] <= y && y < b[1]) || (b[1] <= y && y < a[1]))
          cuts.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      cuts.sort((a, b) => a - b);
      for (let j = 0; j + 1 < cuts.length; j += 2)
        rect(g, cuts[j], y, Math.max(1, cuts[j + 1] - cuts[j]), 1, c);
    }
  }
  const noise = (n) => {
    const a = Math.sin(n * 78.233 + 43.2) * 43758.5453;
    return a - Math.floor(a);
  };
  function sky(w, h, p) {
    const c = canvas(w, h),
      g = c.getContext("2d");
    p.sky.forEach((s, i) =>
      rect(g, 0, Math.floor(h * [0, 0.19, 0.33, 0.48, 0.59][i]), w, h, s),
    );
    const x = Math.floor(w * 0.71),
      y = Math.floor(h * 0.235),
      r = Math.min(23, Math.round(h * 0.112));
    for (let j = -r; j <= r; j++) {
      let dx = Math.floor(Math.sqrt(r * r - j * j) / 2) * 2;
      rect(
        g,
        x - dx,
        y + j,
        dx * 2,
        1,
        j > r * 0.58 ? "#ffd699" : j > r * 0.2 ? "#ffe7ac" : "#fff0c7",
      );
    }
    const cloud = (x, y, s) => {
      for (const [dx, dy, a, b] of [
        [0, 10, 51, 3],
        [4, 7, 42, 4],
        [10, 4, 13, 5],
        [19, 0, 10, 8],
        [29, 3, 7, 6],
        [37, 6, 6, 4],
        [49, 11, 8, 2],
      ])
        rect(g, x + dx * s, y + dy * s, a * s, b * s, "#ebf2df");
      rect(g, x + 7 * s, y + 13 * s, 45 * s, s, "#cee6dc");
    };
    cloud(w * 0.12, h * 0.16, 0.84);
    cloud(w * 0.47, h * 0.105, 0.65);
    cloud(w * 0.83, h * 0.225, 0.99);
    cloud(-12, h * 0.32, 0.62);
    for (let i = 0; i < 12; i++) {
      let x = noise(i) * w,
        y = h * (0.12 + noise(i + 90) * 0.4);
      rect(g, x, y, 8 + noise(i + 33) * 17, 1, "#d2e7dc");
    }
    return c;
  }
  function mesas(h, stage, layer) {
    const w = 832,
      c = canvas(w, h),
      g = c.getContext("2d"),
      p = palettes[stage],
      base = h * (layer === 0 ? 0.75 : 0.81),
      amp = h * (layer === 0 ? 0.17 : 0.17);
    let pnts = [[0, base]];
    for (let k = 0; k <= w; k += 5) {
      let height =
        (Math.sin(k / (layer === 0 ? 42 : 56) + layer) +
          Math.sin(k / 21) * 0.24 +
          1.4) *
        amp *
        0.42;
      pnts.push([k, Math.round((base - height) / 2) * 2]);
    }
    poly(g, [...pnts, [w, h], [0, h]], layer === 0 ? p.far[1] : p.near[1]);
    function butte(x, wide, high, seed) {
      const cols = layer === 0 ? p.far : p.near,
        top = base - high;
      const outline = [
        [0, 1],
        [0.12, 0.86],
        [0.21, 0.74],
        [0.24, 0.48],
        [0.29, 0.47],
        [0.31, 0.23],
        [0.34, 0.23],
        [0.35, 0.055],
        [0.39, 0.055],
        [0.39, 0],
        [0.7, 0],
        [0.7, 0.04],
        [0.76, 0.04],
        [0.77, 0.27],
        [0.82, 0.27],
        [0.83, 0.57],
        [0.88, 0.6],
        [0.91, 0.82],
        [1, 1],
      ].map(([a, b]) => [x + a * wide, top + b * high]);
      poly(g, outline, cols[0]);
      poly(
        g,
        [
          [x + 0.63 * wide, top],
          [x + 0.7 * wide, top],
          [x + 0.77 * wide, top + 0.06 * high],
          [x + 0.79 * wide, top + 0.28 * high],
          [x + 0.83 * wide, top + 0.28 * high],
          [x + 0.85 * wide, top + 0.61 * high],
          [x + 0.89 * wide, top + 0.64 * high],
          [x + wide, base],
          [x + 0.51 * wide, base],
          [x + 0.6 * wide, top + 0.73 * high],
          [x + 0.65 * wide, top + 0.65 * high],
          [x + 0.61 * wide, top + 0.5 * high],
          [x + 0.67 * wide, top + 0.4 * high],
        ],
        cols[1],
      );
      for (let i = 0; i < 18; i++) {
        let a = noise(i + seed),
          b = noise(2 * i + seed + 3);
        rect(
          g,
          x + wide * (0.385 + a * 0.29),
          top + high * (0.06 + b * 0.82),
          2 + a * wide * 0.1,
          1 + Math.floor(b * 2),
          i % 4 === 0 ? cols[3] || cols[0] : cols[1],
        );
      }
      for (let i = 0; i < 4; i++)
        rect(
          g,
          x + wide * (0.46 + 0.045 * i),
          top + high * (0.09 + noise(seed + i) * 0.34),
          2,
          high * (0.06 + 0.09 * noise(i)),
          cols[1],
        );
    }
    if (stage !== 2) {
      const defs =
        layer === 0
          ? [
              [-40, 115, 0.3],
              [50, 115, 0.23],
              [140, 186, 0.32],
              [235, 64, 0.24],
              [350, 139, 0.26],
              [506, 102, 0.3],
              [585, 165, 0.24],
              [723, 150, 0.29],
            ]
          : [
              [-58, 127, 0.32],
              [100, 115, 0.205],
              [207, 115, 0.44],
              [253, 62, 0.36],
              [409, 147, 0.3],
              [481, 79, 0.36],
              [635, 160, 0.37],
              [767, 105, 0.24],
            ];
      defs.forEach(([x, w, f], i) => butte(x, w, f * h, i * 13));
    } else
      for (let k = -90; k < w; k += 96) {
        let peak = base - h * (0.23 + 0.12 * noise(k));
        poly(
          g,
          [
            [k, base],
            [k + 56, peak],
            [k + 128, base],
          ],
          layer ? p.near[0] : p.far[0],
        );
        poly(
          g,
          [
            [k + 56, peak],
            [k + 78, peak + 20],
            [k + 62, peak + 14],
            [k + 52, peak + 19],
            [k + 40, peak + 18],
          ],
          "#edf1df",
        );
      }
    for (let i = 0; i < 200; i++) {
      let x = noise(i + 7) * w,
        y = base + noise(i + 30) * (h - base);
      rect(g, x, y, 2 + noise(i + 103) * 12, 1, layer ? p.near[0] : p.far[0]);
    }
    return c;
  }
  function plant(g, x, y, size, p, stage) {
    const r = (a, b, w, h, col) =>
      rect(g, x + a * size, y + b * size, w * size, h * size, col);
    if (stage === 2) {
      poly(
        g,
        [
          [x - 7 * size, y - 3 * size],
          [x, y - 26 * size],
          [x + 7 * size, y - 3 * size],
        ],
        p.plant[0],
      );
      r(-1, -5, 2, 5, p.plant[0]);
      return;
    }
    r(-2, -24, 5, 24, p.plant[0]);
    r(-1, -26, 3, 2, p.plant[0]);
    r(-1, -24, 2, 23, p.plant[1]);
    r(-7, -15, 3, 7, p.plant[1]);
    r(-7, -9, 6, 3, p.plant[0]);
    r(2, -14, 6, 3, p.plant[0]);
    r(6, -21, 3, 8, p.plant[0]);
    r(6, -20, 1, 7, p.plant[2]);
    r(-7, -15, 1, 6, p.plant[2]);
  }
  function tile(start, height, ground, stage) {
    const w = 256,
      c = canvas(w, height),
      g = c.getContext("2d"),
      p = palettes[stage],
      cl = p.ground;
    for (let x = 0; x < w; x += 2) {
      let wx = start + x,
        y = ground(wx);
      rect(g, x, y, 2, height - y, cl[5]);
      let depth = 0;
      for (const [j, thick] of [3, 5, 8, 13, 20].entries()) {
        const len =
          thick +
          (j === 0
            ? 0
            : Math.round(
                (Math.sin(wx / (11 + j * 4) + j) * 2 + Math.cos(wx / 29) * 2) *
                  (j * 0.43),
              ));
        rect(g, x, y + depth, 2, len, cl[j]);
        depth += len;
      }
    }
    for (let i = Math.floor(start / 5); i < (start + w) / 5; i++) {
      let wx = i * 5 + noise(i) * 4,
        x = wx - start,
        y = ground(wx),
        d = noise(i + 100);
      rect(g, x, y + 2, 1 + noise(i + 9) * 3, 1, cl[1]);
      for (let j = 0; j < 4; j++) {
        let depth = 8 + noise(i + j * 330) * 85;
        rect(
          g,
          x + noise(i + j) * 4,
          y + depth,
          2 + noise(i + j * 21) * 6,
          1 + (depth > 30 ? 1 : 0),
          cl[Math.min(5, Math.floor(depth / 16) + 1)],
        );
      }
      if (d > 0.78) {
        const a = 3 + noise(i * 2) * 4;
        poly(
          g,
          [
            [x - a, y],
            [x - a / 2, y - a * 0.7],
            [x + a * 0.15, y - a * 0.86],
            [x + a, y],
          ],
          cl[3],
        );
        rect(g, x - a / 2, y - a * 0.65, a * 0.7, 1, cl[0]);
      }
      if (d < 0.12) {
        rect(g, x, y - 2, 4, 2, p.plant[0]);
        rect(g, x + 1, y - 4, 1, 2, p.plant[1]);
        rect(g, x + 4, y - 3, 1, 2, p.plant[1]);
      }
    }
    for (
      let i = Math.floor((start - 15) / 104);
      i <= Math.ceil((start + w + 15) / 104);
      i++
    ) {
      let wx = i * 104 + 17 + noise(i + 763) * 32;
      if (Math.abs(wx - 145) < 50) continue;
      plant(g, wx - start, ground(wx), 0.55 + noise(i + 335) * 0.53, p, stage);
    }
    return c;
  }
  function truck() {
    const c = canvas(78, 41),
      g = c.getContext("2d"),
      r = (x, y, w, h, s) => rect(g, x, y, w, h, s),
      o = "#302d30";
    // Roll cage, roof lights, a helmeted driver, and numbered pickup body.
    r(13, 11, 3, 14, o);
    r(16, 8, 11, 3, o);
    r(23, 6, 7, 3, o);
    r(27, 5, 21, 3, o);
    poly(
      g,
      [
        [16, 21],
        [23, 7],
        [46, 7],
        [53, 19],
        [67, 21],
        [71, 24],
        [71, 30],
        [65, 33],
        [10, 33],
        [6, 29],
        [6, 19],
      ],
      o,
    );
    poly(
      g,
      [
        [25, 9],
        [44, 9],
        [50, 19],
        [21, 19],
      ],
      "#a5d4d2",
    );
    poly(
      g,
      [
        [30, 9],
        [38, 9],
        [29, 19],
        [23, 19],
      ],
      "#e0efe0",
    );
    r(35, 9, 2, 12, o);
    r(38, 13, 6, 6, "#9e532e");
    r(38, 13, 6, 3, "#e9a66f");
    r(37, 11, 6, 3, "#f0ddbd");
    r(41, 12, 4, 2, "#334147");
    r(41, 17, 4, 3, "#8e5340");
    r(4, 18, 15, 10, o);
    r(4, 17, 17, 3, "#ed7535");
    r(6, 19, 13, 4, "#ff9747");
    r(6, 23, 13, 5, "#be482a");
    poly(
      g,
      [
        [19, 19],
        [48, 19],
        [56, 18],
        [68, 20],
        [71, 23],
        [70, 29],
        [64, 31],
        [17, 30],
      ],
      "#db5b2e",
    );
    r(20, 19, 30, 3, "#ff9b4b");
    r(51, 19, 15, 2, "#ffc470");
    r(19, 25, 30, 3, "#a93c2b");
    r(25, 23, 19, 6, "#f8e5bf");
    r(23, 8, 24, 2, "#fb9447");
    r(24, 6, 23, 2, "#f16d32");
    r(23, 4, 25, 2, o);
    [24, 31, 38, 45].forEach((x) => {
      r(x, 1, 5, 4, o);
      r(x + 1, 1, 3, 2, "#ffdd94");
    });
    // 07 racing number, side stripes, lights, skid plate and bumpers.
    r(29, 24, 3, 4, o);
    r(30, 25, 1, 2, "#f8e5bf");
    r(34, 24, 4, 1, o);
    r(36, 25, 1, 3, o);
    r(11, 22, 8, 1, "#ffdd8a");
    r(64, 21, 6, 3, "#fff1b1");
    r(66, 25, 6, 3, o);
    r(70, 24, 3, 4, "#6d6b5d");
    r(68, 30, 7, 3, o);
    r(3, 27, 8, 3, "#7a7771");
    r(2, 25, 3, 3, "#ae3328");
    r(20, 31, 36, 4, o);
    r(31, 32, 14, 1, "#848176");
    for (let x of [17, 59]) {
      poly(
        g,
        [
          [x - 10, 32],
          [x - 10, 27],
          [x - 5, 23],
          [x + 5, 23],
          [x + 10, 28],
          [x + 10, 32],
        ],
        o,
      );
      r(x - 5, 23, 10, 2, "#99482d");
    }
    return c;
  }
  function wheel() {
    const c = canvas(20, 20),
      g = c.getContext("2d");
    [
      [0, 3, 14, "#25282a"],
      [2, 3, 10, "#414448"],
      [4, 2, 8, "#24282b"],
      [6, 1, 6, "#99958a"],
      [8, 0, 4, "#464747"],
    ].forEach(([m, b, s, col]) => {
      rect(g, m + b, m, s, 20 - 2 * m, col);
      rect(g, m, m + b, 20 - 2 * m, s, col);
    });
    rect(g, 9, 7, 2, 3, "#d1c0a2");
    return c;
  }
  return {
    palettes,
    canvas,
    rect,
    poly,
    noise,
    sky,
    mesas,
    tile,
    truck,
    wheel,
  };
})();
