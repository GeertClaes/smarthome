import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Sora, Space_Grotesk } from "next/font/google";
import { getData } from "@/lib/data";
import { LanguageProvider } from "./LanguageProvider";
import { SiteContentProvider } from "./SiteContentProvider";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

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
    icons: {
      icon: [
        { url: "/app-icons/favicon.ico" },
        { url: "/app-icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/app-icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/app-icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      apple: [
        { url: "/app-icons/apple-icon.png" },
        { url: "/app-icons/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
        { url: "/app-icons/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
        { url: "/app-icons/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
        { url: "/app-icons/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
        { url: "/app-icons/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
        { url: "/app-icons/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
        { url: "/app-icons/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
        { url: "/app-icons/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/app-icons/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: [{ url: "/app-icons/favicon.ico" }],
    },
    manifest: "/app-icons/manifest.json",
    other: {
      "msapplication-config": "/app-icons/browserconfig.xml",
    },
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
              <AppFooter />
            </div>
          </SiteContentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
