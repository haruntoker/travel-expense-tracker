import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

// export const metadata: Metadata = {
//   title: "Travel Expenses Tracker - Smart Budget Management",
//   description:
//     "Track your travel expenses, manage budgets, and visualize spending patterns with our intuitive expense tracker.",
//   keywords:
//     "travel expenses, budget tracker, expense management, travel budget, spending tracker",
//   authors: [{ name: "Travel Expenses Tracker" }],
//   creator: "Travel Expenses Tracker",
//   openGraph: {
//     title: "Travel Expenses Tracker",
//     description: "Smart budget management for your travels",
//     type: "website",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Travel Expenses Tracker",
//     description: "Smart budget management for your travels",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
