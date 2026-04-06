import HeroSection from '@/pages/landingPage/HeroSection'
import UseCasesSection from '@/pages/landingPage/UseCasesSection'
import VaultSection from '@/pages/landingPage/VaultSection'
import React from 'react'

const Home = () => {
  return (
    <div>
      <HeroSection/>
      <VaultSection/>
      <UseCasesSection/>
    </div>
  )
}

export default Home
