import type { MetadataRoute } from "next";
import { getProductTypes } from "@/lib/api";
import { GUIDES } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/services", "/how-it-works", "/samples", "/guides", "/tools/test-selector", "/faq", "/about", "/contact"];
  const types = await getProductTypes();
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...GUIDES.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}` })),
    ...types.flatMap((t) => [{ url: `${SITE_URL}/services/${t.slug}` }, { url: `${SITE_URL}/order/${t.slug}` }]),
  ];
}
