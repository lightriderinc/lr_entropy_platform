import { MdInfo } from "react-icons/md";
import HowItWorksCard from "./HowItWorksCard";

export default function HowItWorksSection() {
  return (
    <div className="p-4 border-2 border-gray-50 mb-12">
      <h2 className="text-xl font-semibold text-gray-600 mb-4 inline-flex items-center gap-2">
        <MdInfo className="text-gray-200" />
        How it works
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <HowItWorksCard
          n="1"
          title="Collect"
          desc="Raw bits arrive from real quantum and certified hardware sources."
        />
        <HowItWorksCard
          n="2"
          title="Test"
          desc="Every batch passes NIST SP 800-90B health checks before being stored."
        />
        <HowItWorksCard
          n="3"
          title="Extract"
          desc="Sources are combined using SHAKE-256 so no single weak source can bias the output."
        />
        <HowItWorksCard
          n="4"
          title="Deliver"
          desc="You receive bytes and a signed receipt proving exactly what backed your draw."
        />
      </div>
    </div>
  );
}
