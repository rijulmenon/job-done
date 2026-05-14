"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
    >
      Sign Out
    </button>
  );
}
