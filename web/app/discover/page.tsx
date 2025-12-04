import { redirect } from "next/navigation";

// Redirect old /discover URL to the real buyer discovery at /browse
export default function DiscoverPage() {
  redirect("/browse");
}
