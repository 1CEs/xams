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
  title: "XAMS",
  description: "Xams is a platform service for student and instructor.",
  icons: [{ rel: 'icon', url: Favicon.src }]
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
            </div>
          </CookiesProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
