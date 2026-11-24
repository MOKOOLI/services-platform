import { fa } from "@/lib/format";

// Illustrative data, fully deterministic (no Math.random) so server and client agree.
// The fitted line, 95% band and R² are COMPUTED from the points, so the numbers match the picture.
const W = 560, H = 380, L = 44, R = 536, T = 22, B = 346;
const rand = (i: number) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

export default function HeroPlot() {
  const n = 32;
  const pts = Array.from({ length: n }, (_, i) => {
    const x = L + 14 + (i * (R - L - 28)) / (n - 1);
    const trend = B - 40 - 0.5 * (x - L);   // spans the frame: lower-left -> upper-right
    const y = Math.min(B - 10, Math.max(T + 10, trend + (rand(i) - 0.5) * 84));
    return { x, y };
  });

  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const b = sxy / sxx, a = my - b * mx;
  const sse = pts.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0);
  const sst = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const r2 = 1 - sse / sst;
  const se = Math.sqrt(sse / (n - 2));
  const yh = (x: number) => a + b * x;
  const half = (x: number) => 2.04 * se * Math.sqrt(1 / n + (x - mx) ** 2 / sxx);

  const xs = Array.from({ length: 25 }, (_, i) => L + 6 + (i * (R - L - 12)) / 24);
  const upper = xs.map((x) => `${x.toFixed(1)} ${(yh(x) - half(x)).toFixed(1)}`);
  const lower = [...xs].reverse().map((x) => `${x.toFixed(1)} ${(yh(x) + half(x)).toFixed(1)}`);
  const band = `M${upper.join("L")}L${lower.join("L")}Z`;

  const hi = pts[21]; // the point we call out

  return (
    <figure className="plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="نمونه‌ی نمودار پراکندگی همراه با خط برازش و بازه‌ی اطمینان">
        <g className="plot-grid">
          {Array.from({ length: 7 }, (_, k) => <line key={`h${k}`} x1={L} x2={R} y1={T + 4 + k * 53} y2={T + 4 + k * 53} />)}
          {Array.from({ length: 9 }, (_, k) => <line key={`v${k}`} y1={T} y2={B} x1={L + k * 61.5} x2={L + k * 61.5} />)}
        </g>
        <path className="plot-axis" d={`M${L} ${T}V${B}H${R}`} fill="none" />
        <g className="plot-ticks">
          {Array.from({ length: 9 }, (_, k) => <line key={`t${k}`} x1={L + k * 61.5} x2={L + k * 61.5} y1={B} y2={B + 6} />)}
        </g>
        <path className="plot-band" d={band} />
        {pts.map((p, i) => (
          <circle key={i} className="plot-pt" cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="5.2" style={{ animationDelay: `${0.15 + i * 0.045}s` }} />
        ))}
        <path className="plot-fit" d={`M${L + 6} ${yh(L + 6).toFixed(1)} L${R - 6} ${yh(R - 6).toFixed(1)}`} />
        <circle className="plot-ring" cx={hi.x.toFixed(1)} cy={hi.y.toFixed(1)} r="11" />
      </svg>

      <div className="callout" aria-label="خلاصه‌ی نتیجه‌ی نمونه">
        <div><span>ضریب تعیین</span><b dir="ltr">R² = {fa(r2.toFixed(2))}</b></div>
        <div><span>تعداد مشاهده</span><b dir="ltr">n = {fa(n)}</b></div>
      </div>

      <figcaption>
        <span><i className="sw pt" />داده‌ها</span>
        <span><i className="sw fit" />خط برازش</span>
        <span><i className="sw band" />بازه‌ی اطمینان ۹۵٪</span>
        <em>نمونه‌ی تصویری</em>
      </figcaption>
    </figure>
  );
}
