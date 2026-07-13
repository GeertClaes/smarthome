import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/app-icons/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/app-icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/app-icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/app-icons/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/app-icons/apple-icon.png" />
        <link rel="manifest" href="/app-icons/manifest.json" />
        <meta name="msapplication-config" content="/app-icons/browserconfig.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
