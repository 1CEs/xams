import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";
import Navbar from "@/components/navbar";
import Favicon from '@/favicon.ico'
import Footer from "@/components/footer";
import NextTopLoader from "nextjs-toploader";
import { CookiesProvider } from "next-client-cookies/server";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import FloatingActionButton from "@/components/floating-action-button";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "XAMS - Online Learning Management System for Learners & Instructors",
    template: "%s | XAMS"
  },
  description: "XAMS is a comprehensive online learning management platform connecting learners and instructors. Create courses, take exams, track progress, and enhance educational experiences with AI-powered grading.",
  keywords: [
    "online learning",
    "learning management system",
    "LMS",
    "education platform",
    "online courses",
    "learner portal",
    "instructor dashboard",
    "exam system",
    "AI grading",
    "educational technology",
    "e-learning",
    "course management",
    "academic platform"
  ],
  authors: [{ name: "XAMS Team" }],
  creator: "XAMS",
  publisher: "XAMS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://xams.online'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: [
    { rel: 'icon', url: Favicon.src },
    { rel: 'apple-touch-icon', url: Favicon.src }
  ],
  manifest: '/manifest.json', // Add if you have a PWA manifest
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'XAMS - Online Learning Management System',
    description: 'Comprehensive online learning platform for learners and instructors. Create courses, take exams, and track academic progress with advanced features.',
    siteName: 'XAMS',
    images: [
      {
        url: '/og-image.png', // Add your Open Graph image
        width: 1200,
        height: 630,
        alt: 'XAMS Learning Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xams', // Replace with your Twitter handle
    creator: '@xams',
    title: 'XAMS - Online Learning Management System',
    description: 'Comprehensive online learning platform for learners and instructors with AI-powered features.',
    images: ['/twitter-image.png'], // Add your Twitter card image
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <NextUIProvider>
          <NextTopLoader color="#82f4b1" showSpinner={false} />
          {/* Responsive Toast Container */}
          <ToastContainer 
            theme="dark" 
            position="bottom-left"
            className="!bottom-4 !left-4 sm:!bottom-6 sm:!left-6"
            toastClassName="!text-sm sm:!text-base"
            bodyClassName="!p-3 sm:!p-4"
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={5}
          />
          <CookiesProvider>
            {/* Main App Container */}
            <div className="min-h-screen flex flex-col relative">
              {/* Navigation */}
              <Navbar />
              
              {/* Main Content Area */}
              <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
                <div className="flex-1 w-full">
                  {children}
                </div>
              </main>
              
              {/* Footer */}
              <Footer />

              {/* Floating Action Button */}
              <FloatingActionButton />
            </div>
          </CookiesProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
