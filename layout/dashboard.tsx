"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: "/dashboard/clients", label: "Clientes" },
    { href: "/dashboard/pets", label: "Detalles clientes y mascotas" },
  ];

  async function handleLogout() {
    const supabase = supabaseClient();
    await supabase.auth.signOut();
    router.replace("/"); 
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-white p-4 flex min-h-screen flex-col">
        <h2 className="mb-6 text-xl font-bold">Ruffo App</h2>

        <nav className="space-y-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 ${
                  active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
