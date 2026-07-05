import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "../context/auth-context";
import LayoutShell from "../components/LayoutShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechStop Admin",
  description: "TechStop admin panel — manage products, trade-ins, repairs, and orders.",
  icons: {
    icon: "/Icon/icon.png",
    shortcut: "/Icon/icon.png",
    apple: "/Icon/icon.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Calling headers() opts every route out of static prerendering — required
  // so the CSP nonce set per-request in proxy.ts actually matches the nonce
  // Next stamps onto its own script tags at render time. A statically
  // prerendered page (e.g. /login, prerendered at build time) would otherwise
  // ship a stale/absent nonce that never matches the fresh one in the
  // response header, and every script on that page gets CSP-blocked — this is
  // Next's own documented trade-off for nonce-based CSP, not a workaround.
  await headers();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex">
        <AdminAuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
