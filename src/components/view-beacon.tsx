"use client";

import { useEffect, useRef } from "react";
import { recordServiceViewAction } from "@/app/view-actions";

export function ViewBeacon({ serviceId }: { serviceId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void recordServiceViewAction(serviceId);
  }, [serviceId]);

  return null;
}
