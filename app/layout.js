import "./globals.css";
import Script from "next/script";
import { getSettings } from "@/lib/data";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    metadataBase: new URL("https://www.veshop.com.sg"),
    title: {
      default: "VeShop — Hardware, PPE & Safety Supplies Singapore | Vertex Enterprise",
      template: "%s | VeShop"
    },
    description:
      "Browse VeShop's full catalog of hardware tools, PPE, traffic safety, welding and construction supplies in Singapore. Search by brand, price and category.",
    openGraph: {
      title: "VeShop — Hardware, PPE & Safety Supplies Singapore",
      description: "Vertex Enterprise Pte Ltd's full product catalog — hardware, PPE, tools and more.",
      url: "https://www.veshop.com.sg",
      siteName: "VeShop",
      locale: "en_SG",
      type: "website",
      images: settings?.logo_url ? [{ url: settings.logo_url }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: "VeShop — Hardware, PPE & Safety Supplies Singapore",
      description: "Vertex Enterprise Pte Ltd's full product catalog — hardware, PPE, tools and more.",
      images: settings?.logo_url ? [settings.logo_url] : undefined
    }
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const accentColor = settings?.accent_color || "#1B3A6B";
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        {/* Fonts are requested straight from the page (not from inside the stylesheet),
            with the connection opened early — this removes a delay before first paint. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <style>{`:root{ --signal: ${accentColor}; }`}</style>
        {children}
        <FloatingWhatsApp whatsappNumber={settings?.whatsapp_number} />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
