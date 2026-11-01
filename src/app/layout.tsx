import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CardVault — Personal Credit Manager",
  description: "Private dashboard for managing up to 16 credit cards."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}