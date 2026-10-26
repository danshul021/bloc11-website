// 03 experiment — two circles try combination after combination (apart, nested,
// stacked, swapped); the hatched overlap is recomputed live, the dashed orbit
// spins and the guide lines swing like a compass testing angles.
(() => {
  const { track, shift, strokeArc, lineAt, Ln, cam, Frame } = SK;
  const PIVOT = [470, 800];
  const rotAbout = ([x1, y1, x2, y2], deg) => {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const f = (x, y) => [PIVOT[0] + (x - PIVOT[0]) * c - (y - PIVOT[1]) * s, PIVOT[1] + (x - PIVOT[0]) * s + (y - PIVOT[1]) * c];
    return [...f(x1, y1), ...f(x2, y2)];
  };
  const HATCH = Array.from({ length: 90 }, (_, i) => -300 + i * 16);
  function Piece({ settle, texture, paper }) {
    const { T, CUES } = useComposition();
    const H = CUES.Hypothesis, Tr = CUES.Trials, Cv = CUES.Converge;
    const path = (st, k0, k1, k2, k3, k4) => shift([[0, k0], [H, k0], [H + 2.0, k1], [Tr, k1], [Tr + 1.2, k2], [Tr + 1.5, k2], [Tr + 2.7, k3], [Tr + 2.9, k3], [Tr + 4.1, k4], [Cv, k4], [Cv + 2.4, k0, 'settle']], st);
    const c1 = track(T, path(0, [470, 400, 190], [370, 420, 150], [540, 520, 240], [540, 330, 150], [650, 610, 180]), settle);
    const c2 = track(T, path(0.12, [625, 590, 175], [730, 580, 150], [600, 470, 110], [540, 690, 190], [450, 400, 175]), settle);
    const orb = track(T, path(0.2, [600, 500, 225], [550, 500, 300], [560, 500, 280], [540, 510, 270], [550, 500, 250]), settle);
    const spin = track(T, [[0, 0], [H, 0], [Cv + 2.6, 360, 'calm']]);
    const [r1, r2] = track(T, path(0.3, [0, 0], [-22, 26], [14, -12], [-32, 30], [10, -16]), settle);
    const axisX = c1[0], axisY = c1[1];
    return (
      <Frame paper={paper} scale={cam(T, H, CUES.Hold, 0.045)}>
        <defs>
          <clipPath id="cp1"><circle cx={c1[0]} cy={c1[1]} r={c1[2]} /></clipPath>
          <clipPath id="cp2"><circle cx={c2[0]} cy={c2[1]} r={c2[2]} /></clipPath>
        </defs>
        <g filter={texture ? 'url(#wash)' : undefined}>
          <circle cx={c1[0]} cy={c1[1]} r={c1[2]} fill="#b9693f" style={{ mixBlendMode: 'multiply' }} />
          <circle cx={c2[0]} cy={c2[1]} r={c2[2]} fill="#e6c9b9" style={{ mixBlendMode: 'multiply' }} />
        </g>
        <g clipPath="url(#cp1)"><g clipPath="url(#cp2)">
          {HATCH.map((o, i) => <line key={i} x1={o} y1={1080} x2={o + 1080} y2={0} stroke={SK.INK} strokeWidth="1.4" opacity="0.75" />)}
        </g></g>
        <g transform={`rotate(${spin} ${orb[0]} ${orb[1]})`}>
          <path d={strokeArc(orb[0], orb[1], orb[2], -110, 135)} fill="none" stroke={SK.INK} strokeWidth="2" strokeDasharray="7 8" />
        </g>
        <Ln p={[axisX, axisY - 210, axisX, axisY + 440]} dash />
        <Ln p={rotAbout([430, 830, 770, 250], r1)} />
        <Ln p={rotAbout([370, 800, 700, 600], r2)} />
      </Frame>
    );
  }
  window.ExperimentFilm = SK.makeFilm(Piece);
})();
