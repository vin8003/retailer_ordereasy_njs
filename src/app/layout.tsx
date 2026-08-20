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
// "q":"". This must appear as a real <script> in <head> so it captures ?search
// into window.__OE_SEARCH (and sessionStorage) before anything else runs.
// Slash-canonicalize ONLY when there is no query (Profile). Never location.replace
// when search is present — that hop to /details/ is QA's FAIL.
const persistQueryAndCanonicalizeSlash = `(function(){
  var p=location.pathname,s=location.search,h=location.hash;
  if(s){
    try{ if(!window.__OE_SEARCH) window.__OE_SEARCH=s+h; }catch(e){ window.__OE_SEARCH=s+h; }
    try{ sessionStorage.setItem('oe:qs:'+p.replace(/\\/$/, ''),s+h); }catch(e){}
  }
  // Slash-canonicalize ONLY when there is no query (Profile).
  if(!s && p.length>1 && p.charAt(p.length-1)!=='/'){
    location.replace(p+'/'+h);
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
