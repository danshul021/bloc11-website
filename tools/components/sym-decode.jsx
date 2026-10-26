// 02 decode — the composition is taken apart into its planes and axes, re-read
// in a second arrangement, then reassembled.
(() => {
  const { track, shift, Ln, cam, Frame } = SK;
  const S = 3.8, OX = 84, OY = 36;
  const box = ([x, y, w, h]) => [OX + x * S, OY + y * S, w * S, h * S];
  const seg = ([x1, y1, x2, y2]) => [OX + x1 * S, OY + y1 * S, OX + x2 * S, OY + y2 * S];
  const PLANES = [
    { c: '#d0cfb7', blend: 'multiply', K0: [98, 38, 62, 162], K1: [146, 6, 44, 128], K2: [36, 156, 168, 40] },
    { c: '#c4c3aa', blend: 'multiply', K0: [48, 95, 70, 95], K1: [14, 150, 62, 74], K2: [26, 34, 86, 86] },
    { c: '#b0af94', blend: 'multiply', K0: [88, 92, 112, 126], K1: [122, 132, 96, 100], K2: [118, 24, 74, 186] },
    { c: '#504f43', blend: 'normal', K0: [50, 68, 68, 82], K1: [28, 24, 42, 108], K2: [150, 150, 52, 62] },
    { c: '#3a3a31', blend: 'normal', K0: [88, 92, 30, 58], K1: [100, 30, 12, 186], K2: [56, 104, 116, 14] },
    { c: '#4a493e', blend: 'normal', K0: [105, 182, 23, 24], K1: [190, 204, 23, 24], K2: [94, 94, 40, 40] },
  ];
  const LINES = [
    { dash: false, K0: [90, 25, 90, 112], K1: [90, -40, 90, 300], K2: [150, -40, 150, 140] },
    { dash: true, K0: [90, 112, 90, 240], K1: [60, 130, 60, 300], K2: [150, 140, 150, 300] },
    { dash: false, K0: [25, 125, 150, 125], K1: [-40, 70, 280, 70], K2: [20, 190, 210, 190] },
    { dash: true, K0: [190, 68, 190, 100], K1: [206, 10, 206, 250], K2: [100, 16, 100, 92] },
    { dash: true, K0: [130, 192, 215, 192], K1: [-40, 216, 280, 216], K2: [130, 62, 216, 62] },
    { dash: true, K0: [68, 150, 68, 210], K1: [20, 118, 20, 250], K2: [204, 160, 204, 232] },
    { dash: true, K0: [118, 200, 118, 240], K1: [176, -40, 176, 300], K2: [40, 210, 40, 252] },
  ];
  const DOT = { K0: [215, 148], K1: [30, 232], K2: [182, 40] };
  function Piece({ settle, texture, paper }) {
    const { T, CUES } = useComposition();
    const A = CUES.Disassemble, B = CUES.Rearrange, C = CUES.Reform;
    const go = (el, st) => track(T, shift([[0, el.K0], [A, el.K0], [A + 1.9, el.K1], [B, el.K1], [B + 2.1, el.K2], [C, el.K2], [C + 2.4, el.K0, 'settle']], st), settle);
    const d = go(DOT, 0.9);
    return (
      <Frame paper={paper} scale={cam(T, A, CUES.Settle, 0.05)}>
        <g filter={texture ? 'url(#wash)' : undefined}>
          {PLANES.map((pl, i) => { const [x, y, w, h] = box(go(pl, i * 0.12)); return <rect key={i} x={x} y={y} width={w} height={h} fill={pl.c} style={{ mixBlendMode: pl.blend }} />; })}
        </g>
        {LINES.map((l, j) => <Ln key={j} p={seg(go(l, 0.25 + j * 0.08))} dash={l.dash} />)}
        <circle cx={OX + d[0] * S} cy={OY + d[1] * S} r="4" fill={SK.INK} />
      </Frame>
    );
  }
  window.DecodeFilm = SK.makeFilm(Piece);
})();
