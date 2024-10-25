import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NextUIProvider } from "@nextui-org/react";
import Navbar from "@/components/navbar";
import Favicon from '@/favicon.ico'
import Footer from "@/components/footer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextUIProvider>
          <div className=" min-h-screen flex flex-col">
            <Navbar />
            <div className="grow shrink-0">
              {children}
            </div>
            <Footer />
          </div>
        </NextUIProvider>
      </body>
    </html>
  );
}
