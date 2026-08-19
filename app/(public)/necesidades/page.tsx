import { redirect } from "next/navigation";

export default function NeedsRedirect() {
  redirect("/casos");
}
