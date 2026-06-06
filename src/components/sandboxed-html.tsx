"use client";

/**
 * SandboxedHtml — safely render an arbitrary inline HTML document.
 *
 * The markup runs inside a sandboxed iframe via `srcDoc`. We grant
 * `allow-scripts` so generated artifacts can be interactive, but we
 * deliberately NEVER add `allow-same-origin` — without it the frame gets a
 * unique opaque origin and cannot reach our cookies, storage, or DOM. That is
 * what keeps untrusted HTML from doing any damage.
 */
export function SandboxedHtml({
  html,
  title = "Generated HTML artifact",
  className,
}: {
  html: string;
  title?: string;
  className?: string;
}) {
  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={html}
      title={title}
      className={
        className ??
        "h-[560px] w-full rounded-xl border border-border bg-base"
      }
    />
  );
}

export default SandboxedHtml;
