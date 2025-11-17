import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to Voices (explore) page as the main landing page
  redirect("/explore")
}
