import PricingSection from "@/pages/pricing/PricingSection"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing | I Was Killed For This Information",
  description: "Simple and transparent pricing for I Was Killed for This Information. Choose your check-in schedule — daily, weekly, bi-weekly, or monthly — with 5GB encrypted storage included. Upgrade anytime with optional add-ons like 2FA, private email, and extra storage.",
}


const PricingPage = () => {
  return (
    <div>
      <PricingSection/>
    </div>
  )
}

export default PricingPage
