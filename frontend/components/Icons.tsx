type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Check = ({ size = 18 }: P) => <svg {...base(size)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const Lock = ({ size = 22 }: P) => <svg {...base(size)}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
export const Shield = ({ size = 22 }: P) => <svg {...base(size)}><path d="M12 3 5 6v5.5c0 4.4 2.9 8 7 9.5 4.1-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>;
export const Key = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 2.5 2.5M14 9l2 2" /></svg>;
export const Chart = ({ size = 22 }: P) => <svg {...base(size)}><path d="M4 20V5m0 15h16" /><path d="m7.5 15 3.5-4 3 2.5 4.5-6" /></svg>;
