import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyFace - Social Network",
  description: "Connect and share with friends on MyFace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
