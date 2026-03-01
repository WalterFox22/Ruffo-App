import type { ReactNode } from "react";
import DashboardShell from "@/layout/dashboard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}