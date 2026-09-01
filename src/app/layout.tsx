import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "../lib/auth-context";
import { BranchProvider } from "../context/BranchContext";
import { SettingsProvider } from "../context/SettingsContext";
import { Toaster } from "../components/ui/toaster";
import centerConfig from "../config/centerConfig";
import ThemeInjector from "../components/ThemeInjector";

const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: centerConfig.centerName,
  description: `The official portal for ${centerConfig.centerName}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />
      </head>
      <body className={font.className}>
        <ThemeInjector />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SettingsProvider>
              <BranchProvider>
                {children}
                <Toaster />
              </BranchProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}