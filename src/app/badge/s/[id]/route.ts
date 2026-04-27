import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicDetail } from "@/lib/repositories/services";

// Public uniform "kindred 등록됨" badge. Returned as SVG with a 1-day cache;
// content is the same for every service so the cache is shareable across
// makers but we still validate the service exists + is PUBLISHED so we
// don't hand out badges for dead URLs.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const service = await getPublicDetail(supabase, id);
  if (!service || service.status !== "PUBLISHED") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="44" viewBox="0 0 220 44" role="img" aria-label="kindred에 등록됨">
  <rect width="220" height="44" rx="22" fill="#0e0e10" stroke="#d97706" stroke-width="1.5"/>
  <text x="110" y="28" text-anchor="middle" fill="#f6f5f0" font-family="ui-serif, Georgia, 'Instrument Serif', serif" font-style="italic" font-size="16" font-weight="400">kindred ★ 등록됨</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
