"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard/clients", label: "Clientes" },
    { href: "/dashboard/pets", label: "Detalles clientes y mascotas" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-white p-4">
        <h2 className="mb-6 text-xl font-bold">Ruffo App</h2>
        <nav className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 ${
                  active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}