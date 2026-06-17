import type { Metadata } from "next";
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth.context";
import { DevRoleSwitcher } from "@/components/shared/DevRoleSwitcher";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SEVS — Secure Electronic Voting System",
  description: "Security-first electronic voting platform for university elections",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body">
        <AuthProvider>
          {children}
          <DevRoleSwitcher />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}