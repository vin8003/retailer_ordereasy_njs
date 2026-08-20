import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

// Raw blocking IIFE — NOT next/script. next/script beforeInteractive compiles
// to (self.__next_s=...).push(...) in the body and runs after Next hydrates,
// which is too late: App Router then wipes search because the RSC payload has
// "q":"". This must appear as a real <script> in <head> so it stores ?search
// and canonicalizes the trailing slash before hydration.
const persistQueryAndCanonicalizeSlash = `(function(){
  var p=location.pathname,s=location.search,h=location.hash;
  var key='oe:qs:'+p.replace(/\\/$/,'');
  try{ if(s) sessionStorage.setItem(key,s+h); }catch(e){}
  if(p.length>1 && p.charAt(p.length-1)!=='/'){
    location.replace(p+'/'+s+h);
    return;
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: persistQueryAndCanonicalizeSlash }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationWrapper>
          {children}
        </NotificationWrapper>
        <Toaster />
      </body>
    </html>
  );
}
