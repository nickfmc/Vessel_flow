import "~/styles/globals.scss";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "VesselFlow - Tour Booking Management",
  description: "Professional tour booking and vessel management system for marine operators",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
