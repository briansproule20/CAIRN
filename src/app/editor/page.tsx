"use client";

import { useState } from "react";
import Link from "next/link";

const TEMPLATE = `---
title: Untitled
category:
tags: []
status: draft
created: ${new Date().toISOString().split("T")[0]}
updated: ${new Date().toISOString().split("T")[0]}
---

Your content here.
`;

export default function EditorPage() {
  const [content, setContent] = useState(TEMPLATE);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem("cairn_draft", content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          CAIRN
        </Link>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs" style={{ color: "var(--accent-dim)" }}>
              Saved to local storage
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
          >
            Save Draft
          </button>
        </div>
      </header>
      <div className="flex-1 flex">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="flex-1 p-6 text-sm font-mono resize-none outline-none"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            lineHeight: 1.7,
          }}
        />
      </div>
      <footer className="px-6 py-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        Draft editor. To commit to the vault, save and use Claude Code or copy the content into a .mdx file.
      </footer>
    </div>
  );
}
