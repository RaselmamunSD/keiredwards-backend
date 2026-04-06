

import DashboardLayout from "@/pages/authentication/login/DashboardLayout";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Dashboard | Settings and Configuration",
};

export default function DashboardPage() {
  return <DashboardLayout />;
}