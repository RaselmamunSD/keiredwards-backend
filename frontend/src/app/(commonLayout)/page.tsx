"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HeroSection from '@/pages/landingPage/HeroSection'
import UseCasesSection from '@/pages/landingPage/UseCasesSection'
import VaultSection from '@/pages/landingPage/VaultSection'
import React from 'react'

const Home = () => {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname.includes('iwaskilledforthisinformation.one')) {
        setIsRedirecting(true)
        router.replace('/login')
      } else if (hostname.includes('iwaskilledforthisinformation.online')) {
        setIsRedirecting(true)
        router.replace('/register')
      }
    }
  }, [router])

  if (isRedirecting) {
    return null
  }

  return (
    <div id="homepage-root">
      <script dangerouslySetInnerHTML={{__html: `
        if (window.location.hostname.includes('iwaskilledforthisinformation.one') || window.location.hostname.includes('iwaskilledforthisinformation.online')) {
          document.getElementById('homepage-root').style.display = 'none';
        }
      `}} />
      <HeroSection/>
      <VaultSection/>
      <UseCasesSection/>
    </div>
  )
}

export default Home
