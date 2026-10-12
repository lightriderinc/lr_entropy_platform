import { apiError, authenticate, okJson } from "@/lib/api/v1";
import { DRAW_MAX_BYTES, DRAW_MIN_BYTES } from "@/lib/draws/performDraw";
import { MAX_CUSTOM_SOURCES, MIN_CUSTOM_SOURCES, SINGLE_SOURCE_OPTIONS, sourceDisplayName } from "@/lib/entropy/modes";
import { BYTES_PER_TOKEN } from "@/lib/entropy/pricing";
import { getEntropyCatalog } from "@/lib/sources/egress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/sources  (Authorization: Bearer lr_live_...)
 *
 * The sources you can draw from right now: the same Available list as the
 * website (sources with their own pool). For each: whether it is ready, how
 * many bytes one single-source draw could take now, and whether it can join a
 * custom pool (with EMS's reason when it can't).
 */
export async function GET(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const catalog = await getEntropyCatalog();
  if (!catalog.ok && catalog.sources.length === 0 && catalog.multiSources.length === 0) {
    return apiError(502, "upstream_unavailable", "Could not read source status from EMS.");
  }

  const sources = SINGLE_SOURCE_OPTIONS.flatMap((s) => {
    const single = catalog.sources.find((x) => x.source_id === s.id);
    if (!single || single.state === "unavailable") return [];
    const multi = catalog.multiSources.find((x) => x.source_id === s.id);
    return [
      {
        id: s.id,
        name: sourceDisplayName(s.id),
        type: s.tag,
        state: single.state,
        bytes_available: single.bytes_available,
        max_single_draw_bytes: Math.min(single.max_draw_bytes, DRAW_MAX_BYTES),
        credited_rate_bits_per_byte: single.credited_rate_bits_per_byte,
        custom_pool: {
          selectable: multi?.selectable ?? false,
          reason: multi ? multi.reason : "not offered for custom pools right now",
        },
      },
    ];
  });

  return okJson({
    sources,
    modes: ["source", "custom"],
    limits: {
      min_bytes: DRAW_MIN_BYTES,
      max_bytes: DRAW_MAX_BYTES,
      custom_pool_sources: { min: MIN_CUSTOM_SOURCES, max: MAX_CUSTOM_SOURCES },
      requests_per_minute: key.rateLimitPerMinute,
    },
    price: { bytes_per_token: BYTES_PER_TOKEN, usd_per_token: 0.01 },
  });
}
