import ContactSection from '@/pages/contact/ContactSection'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Contact | I Was Killed For This Information',
  description: 'Get in touch with the I Was Killed for This Information team. Have questions about our secure vault, zero-knowledge encryption, or dead-man release system? We are here to help.',
}


const ContactPage = () => {
  return (
    <div>
      <ContactSection/>
    </div>
  )
}

export default ContactPage

