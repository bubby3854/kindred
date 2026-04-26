import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyServiceForOwner } from "@/lib/use-cases/verify-service";

const BodySchema = z.object({
  serviceId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await verifyServiceForOwner(supabase, {
    serviceId: parsed.data.serviceId,
    userId: user.id,
  });

  if (result.ok) return NextResponse.json({ ok: true });
  if (result.status === "not_found")
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (result.status === "forbidden")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (result.status === "slot_full")
    return NextResponse.json(
      { error: "slot_full", plan: result.plan, slots: result.slots },
      { status: 409 },
    );
  return NextResponse.json({
    ok: false,
    reason: result.reason.reason,
    detail: "detail" in result.reason ? result.reason.detail : undefined,
  });
}
