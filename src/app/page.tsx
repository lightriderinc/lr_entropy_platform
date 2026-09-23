import HowItWorksCard from "@/components/HowItWorksCard";
import NavCard from "@/components/NavCard";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { MdInfo } from "react-icons/md";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in-up pb-12">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700">
          Getting started
        </h1>
        <p className="text-sm text-gray-500">
          Get started with quantum-backed randomness for your applications.
        </p>
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4 inline-flex items-center gap-2">
        <MdInfo className="text-gray-200" />
        How it works
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mb-8">
        <HowItWorksCard
          n="01"
          title="Collect"
          desc="Raw bits arrive from real quantum and certified hardware sources."
        />
        <HowItWorksCard
          n="02"
          title="Test"
          desc="Every batch passes NIST SP 800-90B health checks before being stored."
        />
        <HowItWorksCard
          n="03"
          title="Extract"
          desc="Sources are combined using SHAKE-256 so no single weak source can bias the output."
        />
        <HowItWorksCard
          n="04"
          title="Deliver"
          desc="You receive bytes and a signed receipt proving exactly what backed your draw."
        />
      </div>

      <h2 className="text-xl font-bold text-gray-600 mb-4">Quick access</h2>
      <div className="flex flex-row gap-4">
        <NavCard
          icon={HiMiniSquare3Stack3D}
          title="Explore sources"
          href="/sources"
          desc="View available entropy sources from the catalog."
        />
        <NavCard
          icon={GiPerspectiveDiceSixFacesRandom}
          title="Ready to generate?"
          href="/entropy"
          desc="Pick a source and draw verified random bytes with a signed receipt."
        />
      </div>
    </div>
  );
}
