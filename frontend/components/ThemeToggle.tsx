"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/Icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const set = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    setTheme(set ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    setTheme(next);
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"} title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
