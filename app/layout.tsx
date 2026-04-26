import "./globals.css";
import Link from "next/link";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
        
        {/* Floating Logo - Left Corner */}
        <div className="absolute top-4 left-4 md:top-6 md:left-8 z-[100]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="bg-blue-600 text-white rounded-xl p-3 shadow-lg group-hover:bg-blue-700 transition-transform group-hover:scale-105 group-active:scale-95 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-black text-2xl tracking-tighter leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent opacity-90 group-hover:opacity-100 transition-all hidden sm:block drop-shadow-sm">
              MY SHOP
            </span>
          </Link>
        </div>
        {/* Widescreen App Container */}
        <main className="flex-1 w-full relative">
          {children}
        </main>

      </body>
    </html>
  );
}