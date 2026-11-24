// Decorative illustrations for service panels. Purely visual (aria-hidden).
export function AcademicArt() {
  const bars = [{ x: 34, h: 58 }, { x: 94, h: 84 }, { x: 154, h: 108 }, { x: 214, h: 128 }];
  return (
    <svg viewBox="0 0 300 200" aria-hidden="true" className="art">
      <g className="art-grid">{[40, 80, 120, 160].map((y) => <line key={y} x1="14" x2="286" y1={y} y2={y} />)}</g>
      <path className="art-axis" d="M14 168H286" />
      {bars.map((b, i) => (
        <g key={i}>
          <rect className="art-bar" x={b.x} y={168 - b.h} width="44" height={b.h} rx="6" style={{ opacity: 0.35 + i * 0.2 }} />
          <path className="art-err" d={`M${b.x + 22} ${168 - b.h - 14}V${168 - b.h + 12}M${b.x + 14} ${168 - b.h - 14}h16M${b.x + 14} ${168 - b.h + 12}h16`} />
        </g>
      ))}
      <path className="art-sig" d="M56 62V50H236V30" />
      <text x="146" y="42" textAnchor="middle" className="art-star">*</text>
    </svg>
  );
}

export function TechArt() {
  const nodes = [[40, 44], [40, 100], [40, 156], [118, 66], [118, 134], [196, 100]];
  const links: [number, number][] = [[0, 3], [1, 3], [1, 4], [2, 4], [0, 4], [3, 5], [4, 5]];
  return (
    <svg viewBox="0 0 300 200" aria-hidden="true" className="art">
      <g className="art-grid">{[40, 80, 120, 160].map((y) => <line key={y} x1="14" x2="286" y1={y} y2={y} />)}</g>
      {links.map(([a, b], i) => <line key={i} className="art-link" x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}
      {nodes.map(([x, y], i) => <circle key={i} className="art-node" cx={x} cy={y} r={i === 5 ? 11 : 8} />)}
      <path className="art-axis" d="M226 176V52M226 176H288" />
      <path className="art-diag" d="M226 176 288 52" />
      <path className="art-roc-fill" d="M226 176C232 92 250 66 288 56V176Z" />
      <path className="art-roc" d="M226 176C232 92 250 66 288 56" />
    </svg>
  );
}
