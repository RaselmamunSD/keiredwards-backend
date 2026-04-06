import OverviewLayout from "@/pages/authentication/login/OverviewLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Welcome Back",
};

export default function OverviewPage() {
  return <OverviewLayout />;
}