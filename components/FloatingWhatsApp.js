"use client";

import { usePathname } from "next/navigation";

export default function FloatingWhatsApp({ whatsappNumber }) {
  const pathname = usePathname();
  const waNumber = (whatsappNumber || "").replace(/[^0-9]/g, "");

  if (!waNumber || pathname?.startsWith("/admin")) return null;

  return (
    <a
      className="ve-floating-whatsapp"
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/>
        <path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.1-1.34A9.95 9.95 0 0 0 12.02 22C17.52 22 22 17.52 22 12S17.52 2 12.02 2zm0 18.15c-1.67 0-3.23-.46-4.57-1.26l-.33-.19-3.03.8.81-2.95-.21-.34a8.14 8.14 0 0 1-1.26-4.36c0-4.51 3.67-8.18 8.19-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.52-3.67 8.3-8.18 8.3z"/>
      </svg>
    </a>
  );
}
