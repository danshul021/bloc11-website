// 01 question — the mark comes apart and searches: hook halves spin in opposite
// directions, the dot rises into the hook, guide lines pivot like probes, then all resolves.
(() => {
  const { track, shift, arcPath, lineAt, Ln, cam, Frame } = SK;
  const C = [540, 370], R = 175, r = 88;
  const LINES = [
    { p: [600, 140, 600, 560], dash: true, rot: [18, -34], sc: [1.3, 0.8] },
    { p: [300, 300, 420, 300], dash: false, rot: [-30, 42], sc: [1.6, 1.1] },
    { p: [560, 470, 720, 470], dash: true, rot: [24, -20], sc: [1.4, 0.9] },
    { p: [410, 690, 640, 690], dash: false, rot: [-14, 16], sc: [1.2, 1.5] },
    { p: [540, 175, 540, 330], dash: false, rot: [45, -45], sc: [1.5, 0.7] },
  ];
  function Piece({ settle, texture, paper }) {
    const { T, CUES } = useComposition();
    const D = CUES.Doubt, P = CUES.Probe, Rs = CUES.Resolve;
    const leg = (st, k0, k1, k2) => shift([[0, k0], [D, k0], [D + 2.0, k1], [P, k1], [P + 3.0, k2], [Rs, k2], [Rs + 2.6, k0, 'settle']], st);
    const rotA = track(T, shift([[0, 0], [D, 0], [D + 2.0, -25], [P, -25], [P + 3.0, -205], [Rs, -205], [Rs + 2.6, -360, 'settle']], 0), settle);
    const rotB = track(T, shift([[0, 0], [D, 0], [D + 2.0, 20], [P, 20], [P + 3.0, 200], [Rs, 200], [Rs + 2.6, 360, 'settle']], 0.1), settle);
    const offA = track(T, leg(0.05, [0, 0], [-70, -30], [-24, 6]), settle);
    const offB = track(T, leg(0.15, [0, 0], [70, 24], [24, -6]), settle);
    const stem = track(T, leg(0.2, [478, 500, 90, 150], [500, 560, 90, 40], [470, 480, 90, 230]), settle);
    const dot = track(T, leg(0.3, [523, 765, 52], [523, 860, 46], [540, 370, 40]), settle);
    return (
      <Frame paper={paper} scale={cam(T, D, CUES.Hold, 0.05)}>
        <g filter={texture ? 'url(#wash)' : undefined}>
          <g transform={`translate(${offA[0]} ${offA[1]}) rotate(${rotA} ${C[0]} ${C[1]})`}>
            <path d={arcPath(C[0], C[1], R, r, 165, 270)} fill="#d2c9bb" style={{ mixBlendMode: 'multiply' }} />
          </g>
          <rect x={stem[0]} y={stem[1]} width={stem[2]} height={stem[3]} fill="#c6bcad" style={{ mixBlendMode: 'multiply' }} />
          <g transform={`translate(${offB[0]} ${offB[1]}) rotate(${rotB} ${C[0]} ${C[1]})`}>
            <path d={arcPath(C[0], C[1], R, r, 270, 450)} fill="#7f7061" style={{ mixBlendMode: 'multiply' }} />
          </g>
          <circle cx={dot[0]} cy={dot[1]} r={dot[2]} fill="#8c7c6b" />
        </g>
        {LINES.map((l, j) => {
          const [rt, sc] = track(T, leg(0.35 + j * 0.08, [0, 1], [l.rot[0], l.sc[0]], [l.rot[1], l.sc[1]]), settle);
          return <Ln key={j} p={lineAt(l.p, rt, sc)} dash={l.dash} />;
        })}
      </Frame>
    );
  }
  window.QuestionFilm = SK.makeFilm(Piece);
})();
