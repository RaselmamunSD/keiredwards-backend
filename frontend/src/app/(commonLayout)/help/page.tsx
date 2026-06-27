import HelpPage from '@/pages/help/HelpPage'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Help & Documentation | I Was Killed For This Information',
  description: 'Find guides, FAQs, and documentation for setting up your secure vault, zero-knowledge encryption keys, dead-man check-in switches, and trusted recipient files.',
}

const Help = () => {
  return (
    <div>
      <HelpPage />
    </div>
  )
}

export default Help
