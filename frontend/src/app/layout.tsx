import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppChrome } from "@/components/app-chrome";
import { Providers } from "@/components/providers";

import "./globals.css";
import "@copilotkit/react-core/v2/styles.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CopilotKit + Mastra Test Suite",
  description:
    "A navigable, working test harness for the CopilotKit Mastra integration.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <AppChrome>{props.children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
