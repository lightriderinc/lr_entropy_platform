import SourceCatalog from "@/components/sources/SourceCatalog";
import StatCard from "@/components/StatCard";
import { MdGrade } from "react-icons/md";
import { TbDatabaseExport } from "react-icons/tb";

async function getSources() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3002"}/api/sources`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch sources");
    return await res.json();
  } catch {
    return [];
  }
}

export default async function SourcesPage() {
  const sources = await getSources();
  const onlineCount = sources.filter((s: { online: boolean }) => s.online).length;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
          Entropy Sources
        </h1>
        <p className="text-sm text-gray-500">
          Verified quantum and classical entropy sources, live status from EMS.
        </p>
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4">Stats overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Sources online" value={`${onlineCount} / ${sources.length}`} icon={<MdGrade />} />
        <StatCard label="Extraction method" value="SHAKE-256" sub="HMAC-DRBG-SHA-512" small icon={<TbDatabaseExport />} />
      </div>

      <h2 className="text-xl font-bold text-gray-600">Source catalog</h2>
      <SourceCatalog sources={sources} />
    </div>
  );
}