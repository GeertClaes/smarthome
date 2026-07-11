import "./globals.css";
import { Sora, Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "./LanguageProvider";
import AppHeader from "./AppHeader";
import { getData } from "@/lib/data";

export const metadata = {
  title: "Smart Home Docs",
  description: "Device, channel, and installation documentation",
};

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function RootLayout({ children }) {
  const { rooms, devices } = getData();

  return (
    <html lang="en" data-theme="night">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <LanguageProvider>
          <div className="app-shell">
            <AppHeader roomCount={rooms.length} deviceCount={devices.length} />
            <main className="page-wrap">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
