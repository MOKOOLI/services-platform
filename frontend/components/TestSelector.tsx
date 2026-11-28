"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Redo } from "@/components/Icons";
import { RESULTS, TREE } from "@/lib/content";
import { fa } from "@/lib/format";

type Step = { node: string; answer: string };

export default function TestSelector() {
  const [path, setPath] = useState<Step[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const currentId = result ? null : (nextId(path) ?? "goal");

  function nextId(p: Step[]): string | null {
    if (p.length === 0) return "goal";
    const last = p[p.length - 1];
    const opt = TREE[last.node].opts.find((o) => o.label === last.answer);
    return opt?.next ?? null;
  }

  function choose(nodeId: string, label: string, opt: { next?: string; result?: string }) {
    setPath([...path, { node: nodeId, answer: label }]);
    if (opt.result) setResult(opt.result);
  }

  function back() {
    if (result) { setResult(null); setPath(path.slice(0, -1)); return; }
    setPath(path.slice(0, -1));
  }

  function reset() { setPath([]); setResult(null); }

  const total = 4;
  const stepNo = Math.min(path.length + 1, total);
  const res = result ? RESULTS[result] : null;
  const q = currentId ? TREE[currentId] : null;

  return (
    <div className="wizard" aria-live="polite">
      {!res && q && currentId && (
        <>
          <div className="wizard-top">
            <span className="muted small">مرحله‌ی {fa(stepNo)}</span>
            <div className="wizard-bar" aria-hidden="true"><div style={{ width: `${(Math.min(path.length, total) / total) * 100}%` }} /></div>
          </div>
          <h2>{q.q}</h2>
          <div className="wizard-opts">
            {q.opts.map((o) => (
              <button key={o.label} type="button" className="wizard-opt" onClick={() => choose(currentId, o.label, o)}>{o.label}</button>
            ))}
          </div>
          {path.length > 0 && <button type="button" className="linklike" onClick={back}>بازگشت به مرحله‌ی قبل</button>}
        </>
      )}

      {res && (
        <div className="wizard-result">
          <span className="success-icon"><Check size={24} /></span>
          <p className="muted small">آزمون پیشنهادی</p>
          <h2>{res.title}</h2>
          <p>{res.summary}</p>
          <h3>پیش‌فرض‌هایی که باید بررسی شود</h3>
          <ul>{res.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
          <h3>در گزارش چه چیزهایی بیاید؟</h3>
          <p>{res.report}</p>
          <p className="note-box">این یک راهنمای کلی است؛ انتخاب نهایی به طرح پژوهش، مقیاس اندازه‌گیری و پیش‌فرض‌های واقعی داده‌ی شما بستگی دارد.</p>
          <div className="cta-row">
            <Link className="btn" href="/services">سفارش تحلیل آماری</Link>
            <button type="button" className="btn ghost" onClick={reset}><Redo size={16} />شروع دوباره</button>
            <button type="button" className="linklike" onClick={back}>بازگشت و تغییر پاسخ</button>
          </div>
        </div>
      )}
    </div>
  );
}
