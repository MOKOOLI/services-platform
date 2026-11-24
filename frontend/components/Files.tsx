"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiError } from "@/lib/format";

export type FileItem = {
  id: number;
  kind: string;
  filename: string;
  size: number;
  uploaded_by: string;
  locked?: boolean;
};

type Props = {
  title: string;
  base: string;                              // GET list · POST create · POST {id}/complete
  downloadUrl: (id: number) => string;       // GET -> {url}
  deleteUrl?: (id: number) => string;        // admin only
  kind: "attachment" | "deliverable";        // what the uploader creates
  canUpload?: boolean;
};

const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 25);
const KIND_FA: Record<string, string> = { attachment: "پیوست مشتری", deliverable: "خروجی تحویلی" };

function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    Object.entries(headers).forEach(([k, v]) => x.setRequestHeader(k, v));
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(`ذخیره‌سازی فایل ناموفق بود (${x.status})`)));
    x.onerror = () => reject(new Error("خطای شبکه هنگام آپلود"));
    x.send(file);
  });
}

export default function Files({ title, base, downloadUrl, deleteUrl, kind, canUpload = true }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(base, { cache: "no-store" });
      if (r.ok) setFiles(await r.json());
    } catch { /* ignore */ }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  async function upload(file: File) {
    setErr("");
    if (file.size > MAX_MB * 1024 * 1024) { setErr(`حداکثر حجم فایل ${MAX_MB} مگابایت است`); return; }
    // Same content-type for presign AND PUT (browsers give "" for unknown types such as .sav).
    const contentType = file.type || "application/octet-stream";
    try {
      setProgress(0);
      const c = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: contentType, size: file.size, kind }),
      });
      const created = await c.json();
      if (!c.ok) throw new Error(apiError(created, "شروع آپلود ناموفق بود"));
      await putWithProgress(created.upload_url, file, created.headers, setProgress);
      const done = await fetch(`${base}/${created.file_id}/complete`, { method: "POST" });
      if (!done.ok) throw new Error(apiError(await done.json().catch(() => null), "تایید آپلود ناموفق بود"));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "آپلود ناموفق بود");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  async function download(id: number) {
    setErr("");
    const r = await fetch(downloadUrl(id), { cache: "no-store" });
    const data = await r.json().catch(() => null);
    if (!r.ok) { setErr(apiError(data, "دریافت فایل ممکن نیست")); return; }
    window.location.href = data.url;
  }

  async function remove(id: number) {
    if (!deleteUrl || !confirm("این فایل حذف شود؟")) return;
    const r = await fetch(deleteUrl(id), { method: "DELETE" });
    if (r.ok || r.status === 204) load(); else setErr("حذف ناموفق بود");
  }

  return (
    <div style={{ marginTop: 16 }}>
      <strong>{title}</strong>
      {files.length === 0 && <p className="muted" style={{ margin: "6px 0" }}>فایلی وجود ندارد.</p>}
      <ul style={{ paddingInlineStart: 18 }}>
        {files.map((f) => (
          <li key={f.id}>
            <a href="#" onClick={(e) => { e.preventDefault(); download(f.id); }}>{f.filename}</a>{" "}
            <span className="muted">({KIND_FA[f.kind] ?? f.kind} · {(f.size / 1024).toFixed(0)} KB)</span>
            {f.locked && <span className="badge warn">قفل تا پرداخت</span>}
            {deleteUrl && <> <a href="#" onClick={(e) => { e.preventDefault(); remove(f.id); }}>حذف</a></>}
          </li>
        ))}
      </ul>
      {canUpload && (
        <>
          <div className="filepick">
            <input ref={input} type="file" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button type="button" className="secondary small" disabled={progress !== null} onClick={() => input.current?.click()}>
              {progress !== null ? `در حال آپلود… ${progress}٪` : "افزودن فایل"}
            </button>
            <small>حداکثر {MAX_MB} مگابایت برای هر فایل</small>
          </div>
          {progress !== null && <div className="bar"><div style={{ width: `${progress}%` }} /></div>}
        </>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
