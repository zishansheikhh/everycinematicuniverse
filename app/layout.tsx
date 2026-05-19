import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Every Cinematic Universe",
  description:
    "The ultimate guide to every cinematic universe. Explore comprehensive watch orders, interconnected timelines, and deep lore for all your favorite movie and TV franchises.",
  openGraph: {
    title: "Every Cinematic Universe",
    description:
      "Master the multiverse with complete watch orders, character maps, and timelines for every major cinematic universe in film and television.",
    url: "https://everycinematicuniverse.com",
    siteName: "Every Cinematic Universe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Every Cinematic Universe - Watch Orders and Timelines",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Every Cinematic Universe",
    description:
      "Your comprehensive home for movie franchise timelines and watch orders.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "b4463d46d72346adbeeacd38e3b3aef6"}'
        ></script>
      </body>
    </html>
  );
}
