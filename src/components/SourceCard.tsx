import { PolicyTag, SourceStatus } from "@/components/sources/SourceStatus";
import type { DirectorySource } from "@/lib/sources/filters";
import TiltCard from "./ui/TiltCard";

export default function SourceCard({ source }: { source: DirectorySource }) {
  const comingSoon = source.availability === "coming_soon";
  const body = (
    <>
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className={`text-base font-semibold leading-tight ${comingSoon ? "text-gray-400" : ""}`}>
            {source.name}
          </h3>
          <SourceStatus source={source} />
        </div>
        <p className={`text-sm mb-3 ${comingSoon ? "text-gray-400" : "text-gray-600"}`}>{source.type}</p>
      </div>
      <div className="flex">
        <PolicyTag policy={source.policy} muted={comingSoon} />
      </div>
    </>
  );

  // Coming soon: greyed out and static (no tilt), like cloud's unmapped backends.
  if (comingSoon) {
    return (
      <div
        aria-disabled="true"
        className="flex flex-col justify-between border border-gray-100 default-radius p-4 bg-gray-50"
      >
        {body}
      </div>
    );
  }
  return (
    <TiltCard className="flex flex-col justify-between border border-gray-100 default-radius p-4 bg-gray-100 cursor-pointer">
      {body}
    </TiltCard>
  );
}
