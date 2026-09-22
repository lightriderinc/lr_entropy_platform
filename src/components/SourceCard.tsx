const TIER_LABEL: Record<string, string> = {
  "highest-quality": "Highest quality",
  fastest: "Fastest",
};

export default function SourceCard({
  name,
  type,
  tier,
  online,
}: {
  name: string;
  type: string;
  tier: string;
  online: boolean;
}) {
  return (
    <div className="flex flex-col justify-between border border-gray-50 default-radius p-4 bg-gray-50">
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-base font-semibold leading-tight">{name}</h3>
          {online ? (
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
        </div>
        <p className="text-sm text-gray-600 mb-3">{type}</p>
      </div>
      <div className="flex">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            tier === "highest-quality"
              ? "text-purple-700 border border-purple-600 bg-purple-100"
              : "text-emerald-600 border border-emerald-600 bg-emerald-50"
          }`}
        >
          {TIER_LABEL[tier]}
        </span>
      </div>
    </div>
  );
}
