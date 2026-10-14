import InfoBox from "@/components/InfoBox";
import { MAX_BYTES } from "@/lib/entropy/generate";
import { BYTES_PER_CREDIT, creditsFor, formatBytes, formatCredits } from "@/lib/entropy/pricing";

// Draw sizes shown in the table, capped at the per-draw maximum. Derived from
// the live pricing helpers so the table can't drift from what is charged.
const SAMPLE_SIZES = [BYTES_PER_CREDIT, 512, 1024, 2048, MAX_BYTES].filter(
  (bytes, i, all) => bytes <= MAX_BYTES && all.indexOf(bytes) === i,
);

/** "Entropy pricing" section for Purchase Credits: how draws spend credits. */
export default function EntropyPricing() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-600">Entropy pricing</h2>

      <div className="mb-3">
        <InfoBox>
          <span className="font-semibold text-blue-700">Entropy draws</span>
          <br />
          Each draw costs 1 credit per {BYTES_PER_CREDIT} bytes, rounded up, with a minimum of 1 credit.
          The rate is the same in every mode (pool, custom pool, single source) and for every source.
          <br />
          <br />
          <span className="font-semibold text-blue-700">Failed draws</span>
          <br />
          You are never charged for bytes you don&apos;t receive. If a draw fails, its credits are
          returned automatically.
        </InfoBox>
      </div>

      <div className="overflow-hidden default-radius border border-gray-100 bg-gray-50">
        <table className="w-full text-left text-sm">
          <tbody>
            {SAMPLE_SIZES.map((bytes) => (
              <tr key={bytes} className="border-b border-gray-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                  {formatBytes(bytes)}
                  {bytes === MAX_BYTES && (
                    <span className="ml-2 text-xs font-normal text-gray-400">max per draw</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {formatCredits(creditsFor(bytes))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
