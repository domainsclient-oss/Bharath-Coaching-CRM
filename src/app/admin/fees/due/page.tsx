import { redirect } from "next/navigation";

/**
 * "Search Due Fees" was merged into Balance Fees — the two pages read the same
 * `fees` collection and differed only by a `balance > 0` filter, which is now
 * the "Outstanding Only" scope toggle on the merged page.
 *
 * Kept as a redirect so existing bookmarks and links keep working.
 */
export default function DueFeesRedirect() {
  redirect("/admin/fees/balance");
}
