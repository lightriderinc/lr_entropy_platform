import type { Source } from "@/lib/sources/filters";

const POLICY_LABEL: Record<string, string> = {
  "highest-quality": "Highest quality",
  fastest: "Fastest",
};

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="overflow-x-auto default-radius border border-gray-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">Name</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">Type</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">Policy</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr
              key={s.name}
              className="border-b border-gray-100 bg-white transition-colors last:border-0 hover:bg-gray-50"
            >
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                {s.name}
              </td>
              <td className="px-4 py-3 text-gray-700">{s.type}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    s.policy === "highest-quality"
                      ? "text-purple-700 border border-purple-600 bg-purple-100"
                      : "text-emerald-600 border border-emerald-600 bg-emerald-50"
                  }`}
                >
                  {POLICY_LABEL[s.policy] ?? s.policy}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {s.online ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    Offline
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
