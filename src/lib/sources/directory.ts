import { isOfferedSource, ownRingState, SITE_SOURCES, type TierId } from "@/lib/entropy/modes";
import { getEntropyCatalog } from "./egress";
import { fetchSourceOnline } from "./ems";
import type { DirectorySource } from "./filters";

// Server-only. The Sources page list, by the same rule as Get Entropy
// (modes.ts SITE_SOURCES): Available = listed and has its own ring in the
// egress catalogs; Coming soon = listed with `comingSoon`; everything else
// (hidden, or no own ring yet) is not shown.

const POLICY: Record<TierId, string> = {
  highest_quality: "highest-quality",
  quantum_verified: "quantum-verified",
  fastest: "fastest",
};

export async function getSourceDirectory(): Promise<DirectorySource[]> {
  const [catalog, online] = await Promise.all([
    getEntropyCatalog(),
    fetchSourceOnline().catch((err) => {
      console.error("[EMS admin sources error]", err);
      return null;
    }),
  ]);
  // Egress unreachable: we can't see rings, so list the offered sources as
  // offline rather than pretend there are none.
  const egressDown = !catalog.ok && catalog.sources.length === 0 && catalog.multiSources.length === 0;

  const available: DirectorySource[] = [];
  const comingSoon: DirectorySource[] = [];
  for (const s of SITE_SOURCES) {
    const base = { id: s.id, name: s.name, type: s.kind, policy: POLICY[s.tier] };
    if (s.comingSoon) {
      comingSoon.push({ ...base, online: false, availability: "coming_soon", ringState: null });
      continue;
    }
    if (!isOfferedSource(s.id)) continue;
    const ringState = egressDown ? null : ownRingState(s.id, catalog);
    if (!ringState && !egressDown) continue; // no own ring yet: not shown
    available.push({
      ...base,
      online: !egressDown && (online ? online[s.id] === true : true),
      availability: "available",
      ringState,
    });
  }
  return [...available, ...comingSoon];
}
