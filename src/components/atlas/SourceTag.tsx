import { Fragment } from "react";
import { SOURCES, type SourceCode } from "@/data/cities";

export function SourceTag({ code }: { code: SourceCode }) {
  const s = SOURCES[code];
  if (!s) return null;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      title={s.title}
      aria-label={`Source ${code}: ${s.title}`}
      className="num ml-1 inline-flex items-center rounded-full border border-steel px-1.5 align-middle text-[11px] leading-[16px] text-steel transition-colors duration-150 hover:bg-steel-soft"
    >
      {code}
    </a>
  );
}

export function SourceTags({ codes }: { codes: SourceCode[] }) {
  return (
    <>
      {codes.map((c) => (
        <SourceTag key={c} code={c} />
      ))}
    </>
  );
}

/** Renders text, turning [F1]-style codes into source tags. */
export function TaggedText({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z]\d\](?:\s*\[[A-Z]\d\])*)/g);
  return (
    <>
      {parts.map((p, k) => {
        const codes = [...p.matchAll(/\[([A-Z]\d)\]/g)].map((m) => m[1]).filter((c) => c in SOURCES);
        if (codes.length && /^(\[[A-Z]\d\]\s*)+$/.test(p.trim())) {
          return <SourceTags key={k} codes={codes as SourceCode[]} />;
        }
        return <Fragment key={k}>{p}</Fragment>;
      })}
    </>
  );
}
