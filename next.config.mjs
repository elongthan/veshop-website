/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" }
    ]
  },
  // The old site (veshop.com.sg, PrestaShop) used a completely different URL
  // structure. Since the new site takes over the same domain, Google's
  // existing indexed links and anyone's bookmarks would otherwise 404.
  // These forward old addresses to the closest sensible new page.
  async redirects() {
    return [
      // Simple pages
      { source: "/3-shop-now", destination: "/shop", permanent: true },
      { source: "/17-new-products", destination: "/shop", permanent: true },
      { source: "/18-best-sellers", destination: "/shop", permanent: true },
      { source: "/content/1-about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/content/2-privacy-policy", destination: "/privacy", permanent: true },
      { source: "/content/3-terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/my-account", destination: "/", permanent: true },
      { source: "/login", destination: "/", permanent: true },
      { source: "/cart", destination: "/", permanent: true },
      { source: "/order-history", destination: "/", permanent: true },

      // Categories — mapped by name to the new site's category slugs. If any
      // of these category names have since changed, that one entry will need
      // updating to match.
      { source: "/4-ppe-equipment", destination: "/category/ppe-and-equipment", permanent: true },
      { source: "/5-traffic-safety", destination: "/category/traffic-safety", permanent: true },
      { source: "/6-paints-chemicals", destination: "/category/paints-and-chemicals", permanent: true },
      { source: "/7-welding-products", destination: "/category/welding-products", permanent: true },
      { source: "/8-office-dormitory-supplies", destination: "/category/office-and-dormitory-supplies", permanent: true },
      { source: "/9-trolley-ladders", destination: "/category/trolley-and-ladders", permanent: true },
      { source: "/10-abrasive", destination: "/category/abrasive", permanent: true },
      { source: "/11-hand-measuring-tools", destination: "/category/hand-and-measuring-tools", permanent: true },
      { source: "/12-tools-machines", destination: "/category/tools-and-machines", permanent: true },
      { source: "/13-packaging-protection", destination: "/category/packaging-and-protection", permanent: true },
      { source: "/14-others", destination: "/category/others", permanent: true },

      // Individual product and brand pages had no stable ID we can carry
      // over to the new catalog, so these land on a relevant browsable page
      // rather than a dead end.
      { source: "/shop-now/:path*", destination: "/shop", permanent: false },
      { source: "/new-products/:path*", destination: "/shop", permanent: false },
      { source: "/brand/:path*", destination: "/shop", permanent: false }
    ];
  }
};

export default nextConfig;
