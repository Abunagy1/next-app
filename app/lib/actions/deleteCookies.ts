"use server";

import { cookies } from "next/headers";

export default async function deleteCookies(cookiesArr: string[]): Promise<void> {
  const cookieStore = await cookies();
  for (const cookie of cookiesArr) {
    cookieStore.delete(cookie);
  }
}