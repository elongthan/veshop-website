// Admin pages are always built fresh and never use saved copies of data.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AdminRootLayout({ children }) {
  return children;
}
