import React from "react";
import { cn } from "./cn.js";

/** Detects typical pasted URLs (http/https). */
export function textContainsHttpUrl(text) {
  return typeof text === "string" && /https?:\/\//i.test(text);
}

const URL_IN_TEXT = /(https?:\/\/[^\s<>"']+)/gi;

function safeHref(raw) {
  let u = raw.trimEnd();
  while (u.endsWith(")") || u.endsWith("]")) {
    u = u.slice(0, -1);
  }
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Renders plain text with http(s) URLs turned into external links.
 * Newlines preserved via whitespace-pre-wrap on the wrapper.
 */
export function LinkifiedText({
  text,
  className,
  linkClassName = "text-sky-700 underline underline-offset-2 decoration-sky-400/70 hover:text-sky-900",
}) {
  if (text == null || text === "") return null;
  const s = String(text);
  const nodes = [];
  let last = 0;
  let m;
  const re = new RegExp(URL_IN_TEXT.source, "gi");
  let k = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      nodes.push(s.slice(last, m.index));
    }
    const raw = m[1];
    const href = safeHref(raw);
    if (href) {
      nodes.push(
        <a
          key={`u-${k++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          onClick={(e) => e.stopPropagation()}
        >
          {raw}
        </a>
      );
    } else {
      nodes.push(raw);
    }
    last = re.lastIndex;
  }
  if (last < s.length) {
    nodes.push(s.slice(last));
  }
  if (nodes.length === 0) {
    return <span className={cn("whitespace-pre-wrap break-words", className)}>{s}</span>;
  }
  return <span className={cn("whitespace-pre-wrap break-words", className)}>{nodes}</span>;
}
