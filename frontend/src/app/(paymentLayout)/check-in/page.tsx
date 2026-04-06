import CheckInForm from '@/pages/authentication/check-in/CheckInForm'
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "Check-In — I Was Killed for This Information",
  description: "Complete your check-in quickly and securely by providing the required details through our streamlined form.",
};

const Check_In_Page = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <CheckInForm/>
    </div>
  )
}

export default Check_In_Page