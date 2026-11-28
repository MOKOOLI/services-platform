"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackBox({ light = false }: { light?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      className={`trackbox${light ? " on-dark" : ""}`}
      onSubmit={(e) => { e.preventDefault(); if (code.trim()) router.push(`/track?code=${encodeURIComponent(code.trim())}`); }}
    >
      <label htmlFor="quick-code">کد پیگیری دارید؟</label>
      <div>
        <input id="quick-code" dir="ltr" placeholder="کد را اینجا بچسبانید" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        <button type="submit">پیگیری</button>
      </div>
    </form>
  );
}
