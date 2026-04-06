import HowItWorkSection from "@/pages/how-it-work/HowItWorkSection"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works | I Was Killed For This Information",
  description: "Learn how I Was Killed for This Information protects your critical files in 6 simple steps — from creating your encrypted vault and setting check-in schedules to automatic distribution to trusted recipients if you go missing.",
}


const How_It_Work_Page = () => {
  return (
    <div>
      <HowItWorkSection/>
    </div>
  )
}

export default How_It_Work_Page
