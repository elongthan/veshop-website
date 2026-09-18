import "./globals.css";
import Script from "next/script";
import { getSettings } from "@/lib/data";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    metadataBase: new URL("https://veshop.com.sg"),
    title: {
      default: "VeShop — Hardware, PPE & Safety Supplies Singapore | Vertex Enterprise",
      template: "%s | VeShop"
    },
    description:
      "Browse VeShop's full catalog of hardware tools, PPE, traffic safety, welding and construction supplies in Singapore. Search by brand, price and category.",
    openGraph: {
      title: "VeShop — Hardware, PPE & Safety Supplies Singapore",
      description: "Vertex Enterprise Pte Ltd's full product catalog — hardware, PPE, tools and more.",
      url: "https://veshop.com.sg",
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
