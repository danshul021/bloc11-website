// 05 realise — the sun sets and the building sinks back into the ground line;
// after a beat the sun rises, the outline is drawn, and the building is built
// up from the ground with its shadow face and cast shadow.
(() => {
  const { track, shift, Ln, cam, Frame } = SK;
  const GROUND = 720;
  function Piece({ settle, texture, paper }) {
    const { T, CUES } = useComposition();
    const Rc = CUES.Recede, G = CUES.Ground, Ri = CUES.Rise;
    const leg = (st, k0, k1, dur = 3.4) => shift([[0, k0], [Rc, k0], [Rc + 1.8, k1], [Ri, k1], [Ri + dur, k0, 'settle']], st);
    const sunY = track(T, leg(0.25, 470, 1010, 3.0), settle);
    const draw = track(T, shift([[0, 1], [Rc, 1], [Rc + 1.4, 0], [Ri + 0.4, 0], [Ri + 3.4, 1, 'calm']], 0));
    const h = track(T, leg(0, 285, 0, 3.6), settle);
    const sd = track(T, leg(0.1, 63, 0, 3.8), settle);
    const g = track(T, leg(0.4, [280, 800], [470, 610], 2.4), settle);
    const sunK = clamp((sunY - 470) / 540, 0, 1);
    const tail = 260 * (1 - sunK) * (sd / 63);
    const top = GROUND - h;
    const guide = clamp(h / 285, 0, 1);
    return (
      <Frame paper={paper} scale={cam(T, Rc, CUES.Hold, 0.04)}>
        <defs><clipPath id="sky"><rect x="0" y="0" width="1080" height={GROUND + 12} /></clipPath></defs>
        <g filter={texture ? 'url(#wash)' : undefined}>
          <g clipPath="url(#sky)"><circle cx="540" cy={sunY} r="260" fill="#c9a24e" /></g>
          <polygon points={`585,${GROUND - 8} ${585 + tail},${GROUND + 60} ${585 + tail * 0.46},${GROUND + 60}`} fill="#b8913f" opacity={tail > 3 ? 1 : 0} style={{ mixBlendMode: 'multiply' }} />
          <polygon points={`562,${top} ${562 + sd},${top - sd * 0.48} ${562 + sd},${GROUND - sd * 0.48} 562,${GROUND}`} fill="#7a6a45" opacity={sd > 1 ? 1 : 0} style={{ mixBlendMode: 'multiply' }} />
          <rect x="470" y={top} width="92" height={h} fill="#efe8d7" />
        </g>
        <circle cx="548" cy="478" r="272" fill="none" stroke={SK.INK} strokeWidth="2" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={draw > 0.004 ? 1 : 0} transform="rotate(-90 548 478)" />
        <Ln p={[g[0], GROUND, g[1], GROUND]} />
        <Ln p={[515, top - 50 * guide, 515, top]} w={1.4} />
        <Ln p={[532, top - 32 * guide, 532, top]} w={1.4} />
      </Frame>
    );
  }
  window.RealiseFilm = SK.makeFilm(Piece);
})();
