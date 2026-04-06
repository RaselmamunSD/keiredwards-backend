

import SignupFlow from "@/pages/authentication/SignupFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — I Was Killed for This Information",  
  description: "Create your secure account.",
};

export default function SignupPage() {
  return <SignupFlow />;
}