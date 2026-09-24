import { getSession } from "@/lib/auth/session";
import NavCard from "@/components/NavCard";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";

export default async function QuickAccess() {
  const { isAuthenticated } = await getSession();

  return (
    <>
      <h2 className="text-xl font-bold text-gray-600 mb-4">Quick access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NavCard
          icon={HiMiniSquare3Stack3D}
          title="Explore sources"
          href="/sources"
          desc="View available entropy sources from the catalog."
        />
        {isAuthenticated && (
          <NavCard
            icon={GiPerspectiveDiceSixFacesRandom}
            title="Ready to generate?"
            href="/entropy"
            desc="Pick a source and draw verified random bytes with a signed receipt."
          />
        )}
      </div>
    </>
  );
}
