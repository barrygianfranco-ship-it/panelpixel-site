// Sitemap sempre aggiornata: le pagine fisse restano in sitemap.xml, gli articoli
// approvati arrivano da Sanity a ogni richiesta.
const SITE_URL = "https://panelpixel.it";
const SANITY_PROJECT_ID = "np9ttr0b";
const SANITY_API_VERSION = "2026-10-17";
const SANITY_PRODUCTION_DATASET = "production";

function escapeXml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async (request, context) => {
  const response = await context.next();
  if (!response.ok) return response;
  try {
    const url = new URL(`https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_PRODUCTION_DATASET}`);
    url.searchParams.set("query", '*[_type == "articolo" && stato == "approvato" && defined(slug.current)] | order(date desc){"slug": slug.current, date, _updatedAt}');
    url.searchParams.set("perspective", "published");
    const sanity = await fetch(url, {headers: {accept: "application/json"}});
    if (!sanity.ok) return response;
    const articles = (await sanity.json()).result || [];
    const entries = articles.map((article) => {
      const lastmod = String(article._updatedAt || article.date || "").slice(0, 10);
      return `  <url><loc>${escapeXml(SITE_URL + "/articoli/" + encodeURIComponent(article.slug))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.8</priority></url>`;
    }).join("\n");
    const xml = (await response.text()).replace("</urlset>", entries + "\n</urlset>");
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("content-type", "application/xml; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(xml, {status: 200, headers});
  } catch (error) {
    console.error("sitemap edge function:", error);
    return response;
  }
};
