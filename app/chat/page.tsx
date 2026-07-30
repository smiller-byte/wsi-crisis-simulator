import { cookies } from "next/headers";
import { STAFF_COOKIE, verifyStaffToken } from "@/lib/session";
import { PERSONAS } from "@/lib/personas/renee";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const session = await verifyStaffToken(cookieStore.get(STAFF_COOKIE)?.value);
  // proxy.ts guarantees `session` is set for this route, but narrow for TypeScript.
  const staffName = session?.staffName ?? "";

  return <ChatClient staffName={staffName} persona={PERSONAS.renee} />;
}
