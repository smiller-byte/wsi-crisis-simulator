import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { STAFF_COOKIE, verifyStaffToken } from "@/lib/session";

export default async function Home() {
  const cookieStore = await cookies();
  const session = await verifyStaffToken(cookieStore.get(STAFF_COOKIE)?.value);

  redirect(session ? "/chat" : "/login");
}
