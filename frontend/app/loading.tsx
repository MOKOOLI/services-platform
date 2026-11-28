export default function Loading() {
  return (
    <div className="skeleton" role="status" aria-label="در حال بارگذاری">
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="sk-grid"><div className="sk sk-box" /><div className="sk sk-box" /></div>
    </div>
  );
}
