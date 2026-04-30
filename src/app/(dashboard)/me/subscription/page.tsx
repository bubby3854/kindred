import { redirect } from "next/navigation";

// Payment is paused for MVP launch. Keep this route to avoid 404s on
// existing links/bookmarks; redirect to dashboard. Re-enable by reverting
// to the previous CheckoutButton/PortalButton implementation when payment
// is ready (LS env vars also need to be set).
export default function SubscriptionPage() {
  redirect("/me");
}
