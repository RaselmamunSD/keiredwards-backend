import About from '@/pages/about/About'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'About | I Was Killed For This Information',
  description: 'I Was Killed for This Information is a secure-release platform that protects your most critical files, evidence, and documents inside a zero-knowledge encrypted vault. Built for journalists, whistleblowers, and anyone who needs their truth preserved — no matter what happens to them.',
}

const AboutPage = () => {
  return (
    <div>
      <About/>
    </div>
  )
}

export default AboutPage
