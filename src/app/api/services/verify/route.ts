import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { verifyOwnership } from "@/lib/verify";

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

  const { data: service, error } = await supabase
    .from("services")
    .select("id, owner_id, url, verify_token, status")
    .eq("id", parsed.data.serviceId)
    .single();

  if (error || !service) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (service.owner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await verifyOwnership(service.url, service.verify_token);
  const now = new Date().toISOString();

  if (!result.ok) {
    await supabase
      .from("services")
      .update({ last_verified_at: now })
      .eq("id", service.id);
    return NextResponse.json({ ok: false, reason: result.reason, detail: "detail" in result ? result.detail : undefined });
  }

  const nextStatus = service.status === "DRAFT" || service.status === "PENDING_VERIFY"
    ? "PUBLISHED"
    : service.status;

  await supabase
    .from("services")
    .update({
      verified_at: now,
      last_verified_at: now,
      status: nextStatus,
      published_at: nextStatus === "PUBLISHED" ? now : null,
    })
    .eq("id", service.id);

  return NextResponse.json({ ok: true });
}
