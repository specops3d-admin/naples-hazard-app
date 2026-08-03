"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/hazards", label: "Hazards" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflow", label: "Workflow" },
  { href: "/presentation", label: "Presentation" },
  { href: "/timeline", label: "Timeline" },
  { href: "/checklist", label: "Checklist" },
  { href: "/sources", label: "Sources" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[var(--brand-navy)] text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <span className="block font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight sm:text-xl">
            Naples Hazards
          </span>
          <span className="block truncate text-xs text-slate-300">
            City Council Assessment Dashboard
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex items-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close menu" : "Menu"}
        </button>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                    isActive(item.href)
                      ? "bg-white/15 text-white"
                      : "text-slate-200 hover:bg-white/10 hover:text-white",
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-white/10 lg:hidden"
      >
        <nav aria-label="Mobile primary" className="mx-auto max-w-6xl px-4 py-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                    isActive(item.href) ? "bg-white/15" : "hover:bg-white/10",
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
