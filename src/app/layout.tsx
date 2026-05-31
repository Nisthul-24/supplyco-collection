import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supplyco Collection & Sales Management",
  description: "A modern glassmorphic dashboard for shop daily collection tracking and monthly sales reports analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
