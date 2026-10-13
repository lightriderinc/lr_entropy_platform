import SourceCatalog from "@/components/sources/SourceCatalog";
import StatCard from "@/components/StatCard";
import { getSourceDirectory } from "@/lib/sources/directory";
import { TbDatabaseExport } from "react-icons/tb";

export default async function SourcesPage() {
  const sources = await getSourceDirectory();

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

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Extraction method" value="SHAKE-256" sub="HMAC-DRBG-SHA-512" small icon={<TbDatabaseExport />} />
      </div>

      <h2 className="text-xl font-semibold text-gray-600">Source catalog</h2>
      <SourceCatalog sources={sources} />
    </div>
  );
}