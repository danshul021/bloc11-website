// 04 refine — the assembly loosens, then tightens in three passes, each smaller
// than the last (arcs turn in quarter steps, blocks resize), until it locks.
(() => {
  const { track, shift, arcPath, Ln, cam, Frame } = SK;
  const RECTS = [
    { c: '#aab5c0', k: [360, 220, 180, 260], d: [-120, -90, -40, 30] },
    { c: '#6d8297', k: [360, 480, 110, 280], d: [-150, 80, 20, -60] },
    { c: '#3f5367', k: [470, 480, 90, 280], d: [0, 160, -30, 40] },
    { c: '#8496a8', k: [560, 640, 50, 120], d: [140, 120, 30, 0] },
  ];
  const ARCS = [
    { c: '#34475b', k: [640, 345, 100, 180, 270], d: [120, -110, 90] },
    { c: '#d6dce2', k: [640, 480, 115, 90, 270], d: [160, 0, -90] },
    { c: '#34475b', k: [560, 560, 90, -90, 90], d: [130, 90, 180] },
  ];
  const LINES = [
    { p: [480, 160, 480, 480], dash: false, d: [-90, 0] },
    { p: [560, 300, 560, 800], dash: false, d: [110, 0] },
    { p: [540, 225, 760, 225], dash: true, d: [0, -80] },
    { p: [560, 480, 720, 480], dash: true, d: [60, 0] },
    { p: [560, 640, 720, 640], dash: true, d: [0, 70] },
    { p: [330, 760, 650, 760], dash: false, d: [0, 90] },
  ];
  function Piece({ settle, texture, paper }) {
    const { T, CUES } = useComposition();
    const L = CUES.Loosen, I = CUES.Iterate, K = CUES.Lock;
    const mag = (st) => track(T, shift([[0, 0], [L, 0], [L + 1.8, 1], [I, 1], [I + 1.0, 0.6], [I + 1.5, 0.6], [I + 2.5, 0.33], [I + 3.0, 0.33], [I + 4.0, 0.13], [K, 0.13], [K + 1.6, 0, 'settle']], st), settle);
    const dot = mag(0.5);
    return (
      <Frame paper={paper} scale={cam(T, L, CUES.Hold, 0.04)}>
        <g filter={texture ? 'url(#wash)' : undefined}>
          {RECTS.map((r, i) => { const m = mag(i * 0.07); const [x, y, w, h] = r.k; return <rect key={'r' + i} x={x + r.d[0] * m} y={y + r.d[1] * m} width={w + r.d[2] * m} height={h + r.d[3] * m} fill={r.c} style={{ mixBlendMode: 'multiply' }} />; })}
          {ARCS.map((a, i) => { const m = mag(0.15 + i * 0.07); const [cx, cy, R, a0, a1] = a.k; return <g key={'a' + i} transform={`translate(${a.d[0] * m} ${a.d[1] * m}) rotate(${a.d[2] * m} ${cx} ${cy})`}><path d={arcPath(cx, cy, R, 0, a0, a1)} fill={a.c} style={{ mixBlendMode: 'multiply' }} /></g>; })}
        </g>
        {LINES.map((l, j) => { const m = mag(0.3 + j * 0.06); return <Ln key={j} p={[l.p[0] + l.d[0] * m, l.p[1] + l.d[1] * m, l.p[2] + l.d[0] * m, l.p[3] + l.d[1] * m]} dash={l.dash} />; })}
        <circle cx={760 + 80 * dot} cy={490 - 120 * dot} r="4" fill={SK.INK} />
      </Frame>
    );
  }
  window.RefineFilm = SK.makeFilm(Piece);
})();
