import PrivacyPolicyPage from '@/pages/privacyAndPolicyPage/PrivacyPolicyPage'
import type { Metadata } from "next";
import React from 'react'

export const metadata: Metadata = {
  title: "Privacy Policy — I Was Killed for This Information",
  description: "Learn how we collect, use, and protect your personal information on our secure disclosure platform.",
};

const PrivacyAndPolicyPage = () => {
  return (
    <div>
      <PrivacyPolicyPage/>
    </div>
  )
}

export default PrivacyAndPolicyPage