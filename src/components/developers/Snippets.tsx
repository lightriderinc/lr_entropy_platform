import type { Snippet } from "@/lib/developers/snippets";
import CodeBlock from "./CodeBlock";

/** Captioned, copyable code blocks. */
export default function Snippets({ items }: { items: Snippet[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <div key={s.label + s.code}>
          <p className="text-sm text-gray-600">{s.label}</p>
          <CodeBlock code={s.code} />
        </div>
      ))}
    </div>
  );
}
