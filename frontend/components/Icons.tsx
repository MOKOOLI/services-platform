type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Check = ({ size = 18 }: P) => <svg {...base(size)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const Lock = ({ size = 22 }: P) => <svg {...base(size)}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
export const Shield = ({ size = 22 }: P) => <svg {...base(size)}><path d="M12 3 5 6v5.5c0 4.4 2.9 8 7 9.5 4.1-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>;
export const Key = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m-3 3 2.5 2.5M14 9l2 2" /></svg>;
export const Chart = ({ size = 22 }: P) => <svg {...base(size)}><path d="M4 20V5m0 15h16" /><path d="m7.5 15 3.5-4 3 2.5 4.5-6" /></svg>;
export const Mail = ({ size = 22 }: P) => <svg {...base(size)}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4 7.5 8 6 8-6" /></svg>;
export const Card = ({ size = 22 }: P) => <svg {...base(size)}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" /></svg>;
export const Sun = ({ size = 20 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>;
export const Moon = ({ size = 20 }: P) => <svg {...base(size)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>;
export const Menu = ({ size = 22 }: P) => <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const Close = ({ size = 22 }: P) => <svg {...base(size)}><path d="m6 6 12 12M18 6 6 18" /></svg>;
export const ArrowUp = ({ size = 20 }: P) => <svg {...base(size)}><path d="M12 19V5m-6 6 6-6 6 6" /></svg>;
export const Search = ({ size = 20 }: P) => <svg {...base(size)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>;
export const Chevron = ({ size = 18 }: P) => <svg {...base(size)}><path d="m6 9 6 6 6-6" /></svg>;
export const Chat = ({ size = 22 }: P) => <svg {...base(size)}><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
export const Phone = ({ size = 20 }: P) => <svg {...base(size)}><path d="M6.5 3.5 9 3l1.8 4.3-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2L20.1 14l-.6 2.5a2.5 2.5 0 0 1-2.6 1.9C10.1 18 6 13.9 4.6 7.1a2.5 2.5 0 0 1 1.9-2.6Z" /></svg>;
export const Send = ({ size = 20 }: P) => <svg {...base(size)}><path d="M21 3 3 10.5l6 2.5 2.5 6L21 3Z" /><path d="m9 13 12-10" /></svg>;
export const Book = ({ size = 22 }: P) => <svg {...base(size)}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15ZM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" /></svg>;
export const Compass = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>;
export const Clock = ({ size = 18 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const Redo = ({ size = 18 }: P) => <svg {...base(size)}><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" /></svg>;
export const Users = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.2 2.7-5 6-5s6 1.8 6 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.2c2.6.2 4.5 1.6 4.5 4.3" /></svg>;

export const ICONS = { key: Key, lock: Lock, mail: Mail, card: Card, shield: Shield, chart: Chart } as const;
