import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Roboto_Condensed } from "next/font/google";
import "@/app/globals.css";
import Navbar from "@/shared/Navbar";
import Footer from "@/shared/Footer";
import ScrollToTopButton from "@/BottomScrolling/ScrollToTopButton";

import { Bebas_Neue } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const anton = Anton({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-anton",
});


export const metadata: Metadata = {
  title: "I was killed",
  description: "A platform to share and discover stories of individuals who have been killed, fostering awareness and remembrance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${anton.variable} antialiased min-h-screen flex flex-col bg-black text-white`}
      >
        <main className="flex-1 w-full h-screen">
          <AuthProvider>
            {children}
          </AuthProvider>
        </main>
        <ScrollToTopButton />
        <ToastContainer />
      </body>
    </html>
  );
}