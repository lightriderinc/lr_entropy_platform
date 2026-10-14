import CopyButton from "@/components/ui/CopyButton";

/** Dark code block with a copy button (used on /developers and the API key panel). */
export default function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative mt-2 default-radius bg-gray-900">
      <div className="absolute right-2 top-2 default-radius bg-white">
        <CopyButton value={code} label={null} />
      </div>
      <pre className="overflow-x-auto p-4 pr-14 font-mono text-xs leading-relaxed text-gray-100">{code}</pre>
    </div>
  );
}
