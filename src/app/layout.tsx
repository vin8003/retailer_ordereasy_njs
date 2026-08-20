import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrderEasy Retailer",
  description: "OrderEasy Retailer Management Portal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import NotificationWrapper from "@/app/components/NotificationWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="trailing-slash-canonicalize" strategy="beforeInteractive">
          {`(function(){
  var p=location.pathname,s=location.search,h=location.hash;
  if(p.length>1&&p.charAt(p.length-1)!=="/")location.replace(p+"/"+s+h);
})();`}
        </Script>
        <NotificationWrapper>
          {children}
        </NotificationWrapper>
        <Toaster />
      </body>
    </html>
  );
}
