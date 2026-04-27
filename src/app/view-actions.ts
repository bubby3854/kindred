"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordView } from "@/lib/repositories/service-views";
import { getPublicDetail } from "@/lib/repositories/services";

export async function recordServiceViewAction(
  serviceId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Don't count owner self-views.
  if (user) {
    const service = await getPublicDetail(supabase, serviceId);
    if (service && service.owner_id === user.id) return;
  }

  const admin = createAdminClient();
  await recordView(admin, serviceId, user?.id ?? null);
}
