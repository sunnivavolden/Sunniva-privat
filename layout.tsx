import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thailand med små barn | Reiseplanlegger",
  description:
    "Sammenlign reiseruter, transport, budsjett og barnevennlige aktiviteter for to uker i Thailand.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
