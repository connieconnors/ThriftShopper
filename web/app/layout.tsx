import type { Metadata, Viewport } from "next";

import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "./context/AuthContext";

import { AppShellBaseline } from "../components/AppShellBaseline";

import { SafeAreaShell } from "../components/SafeAreaShell";

import PWARegister from "./components/PWARegister";

import { PostHogProvider } from "./providers/PostHogProvider";
import { GoogleAnalytics } from "../components/GoogleAnalytics";
import { brandShareMetadata } from "../lib/shareMetadata";

const inter = Inter({

  variable: "--font-ui",

  subsets: ["latin"],

  weight: ["400", "500", "600"],

});



const geistMono = Geist_Mono({

  variable: "--font-geist-mono",

  subsets: ["latin"],

});



const playfair = Playfair_Display({

  variable: "--font-playfair",

  subsets: ["latin"],

  weight: ["400", "500", "600"],

  style: ["normal", "italic"],

});



export const metadata: Metadata = {
  ...brandShareMetadata,
  manifest: "/manifest.json",

  appleWebApp: {

    capable: true,

    statusBarStyle: "default",

    title: "ThriftShopper",

  },

  formatDetection: {

    telephone: false,

  },

  icons: {

    icon: "/icon-192.png",

    apple: "/icon-192.png",

  },

};



export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ede9e1",
  viewportFit: "cover",
};



export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode;

}>) {

  return (

    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${playfair.variable}`}
    >

      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var c='#ede9e1';document.documentElement.style.backgroundColor=c;document.documentElement.style.colorScheme='light only';document.body.style.backgroundColor=c;document.body.style.minHeight='100dvh';var m=document.querySelector('meta[name="theme-color"]');if(m){m.content=c;}else{var t=document.createElement('meta');t.name='theme-color';t.content=c;document.head.appendChild(t);}})();`,
          }}
        />

        <PostHogProvider>

          <GoogleAnalytics />

          <PWARegister />

          <AuthProvider>

            <AppShellBaseline />

            <SafeAreaShell />

            <div id="app-root" className="min-h-[100dvh] w-full max-w-full overflow-x-clip">
              {children}
            </div>

          </AuthProvider>

        </PostHogProvider>

      </body>

    </html>

  );

}

