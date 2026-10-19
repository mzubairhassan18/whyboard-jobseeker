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
  metadataBase: new URL("https://jobseeker.whyboard.app"),
  title: "Whyboard — why you're not getting hired",
  description:
    "Drop your job-application CSV. Whyboard reads it like a detective: it queries the data, tests hypotheses, and tells you why the rejections keep happening — with the receipts.",
  openGraph: {
    title: "Whyboard — why you're not getting hired",
    description:
      "An AI detective for your job search. CSV in, evidence-backed story out.",
    url: "https://jobseeker.whyboard.app",
    siteName: "Whyboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Whyboard — why you're not getting hired",
    description: "CSV in, evidence-backed story out.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
