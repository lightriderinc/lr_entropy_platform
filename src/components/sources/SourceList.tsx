import type { DirectorySource } from "@/lib/sources/filters";
import { PolicyTag, SourceStatus } from "./SourceStatus";

export default function SourceList({ sources }: { sources: DirectorySource[] }) {
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
          {sources.map((s) => {
            const comingSoon = s.availability === "coming_soon";
            return (
              <tr
                key={s.id}
                aria-disabled={comingSoon || undefined}
                className={[
                  "border-b border-gray-100 transition-colors last:border-0",
                  comingSoon ? "bg-gray-50" : "bg-white hover:bg-gray-50",
                ].join(" ")}
              >
                <td className={`whitespace-nowrap px-4 py-3 font-medium ${comingSoon ? "text-gray-400" : "text-gray-800"}`}>
                  {s.name}
                </td>
                <td className={`px-4 py-3 ${comingSoon ? "text-gray-400" : "text-gray-700"}`}>{s.type}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <PolicyTag policy={s.policy} muted={comingSoon} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <SourceStatus source={s} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
