import TermsOfService from '@/pages/TermsOfServicePage/TermsOfService'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: "Terms Of Service — I Was Killed for This Information",
  description: "Read the terms and conditions governing the use of our platform, including user responsibilities, rights, and acceptable usage policies.",
};


const TermsAndServicesPage = () => {
  return (
    <div>
      <TermsOfService/>
    </div>
  )
}

export default TermsAndServicesPage
