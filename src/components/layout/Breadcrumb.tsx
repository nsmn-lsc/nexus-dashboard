"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-500 py-2">
      <Link href="/dashboard" className="hover:text-hud-cyan transition-colors">
        SYS_ROOT
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            {isLast ? (
              <span className="text-hud-cyan uppercase font-semibold">
                {segment}
              </span>
            ) : (
              <Link href={href} className="hover:text-slate-300 uppercase transition-colors">
                {segment}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
