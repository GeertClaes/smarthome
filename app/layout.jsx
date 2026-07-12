import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Sora, Space_Grotesk } from "next/font/google";
import { getData } from "@/lib/data";
import { LanguageProvider } from "./LanguageProvider";
import { SiteContentProvider } from "./SiteContentProvider";
import AppHeader from "./AppHeader";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export async function generateMetadata() {
  const { site } = getData();
  const title = site?.meta?.title_i18n?.en ?? "JWS11 — Property 4.2";
  const description =
    site?.meta?.description_i18n?.en ??
    "Device, channel, and installation documentation for JWS11 property 4.2";

  return {
    title,
    description,
  };
}

export default function RootLayout({ children }) {
  const { site } = getData();

  return (
    <html lang="en" data-theme="jws11">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <LanguageProvider>
          <SiteContentProvider site={site}>
            <div className="app-frame">
              <AppHeader />
              <main className="content-pane page-wrap">{children}</main>
            </div>
          </SiteContentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
