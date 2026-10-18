// Feed RSS degli ultimi articoli approvati su Sanity: serve a Google Discover
// (pulsante «Segui») e ai lettori di feed.
const SITE_URL = "https://panelpixel.it";
const SANITY_PROJECT_ID = "np9ttr0b";
const SANITY_API_VERSION = "2026-10-17";
const SANITY_PRODUCTION_DATASET = "production";
const CATEGORY_NAMES = {recensioni: "Recensioni", monografie: "Monografie", attualita: "Attualità", anteprime: "Anteprime", approfondimenti: "Approfondimenti"};

function escapeXml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function rfc822(value) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value + "T08:00:00Z" : String(value || "").replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "" : date.toUTCString();
}
function coverUrl(url) {
  if (!url) return "";
  const image = new URL(url);
  image.searchParams.set("w", "1200"); image.searchParams.set("h", "675");
  image.searchParams.set("fit", "crop"); image.searchParams.set("fm", "jpg"); image.searchParams.set("q", "80");
  return image.toString();
}

export default async () => {
  const url = new URL(`https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_PRODUCTION_DATASET}`);
  url.searchParams.set("query", '*[_type == "articolo" && stato == "approvato" && defined(slug.current)] | order(date desc)[0...30]{title, "slug": slug.current, excerpt, seo_description, author, category, date, "image": image.asset->url, "imageAlt": image.alt}');
  url.searchParams.set("perspective", "published");
  const sanity = await fetch(url, {headers: {accept: "application/json"}});
  if (!sanity.ok) return new Response("Feed non disponibile", {status: 503, headers: {"content-type": "text/plain; charset=utf-8", "retry-after": "300"}});
  const articles = (await sanity.json()).result || [];
  const items = articles.map((article) => {
    const link = SITE_URL + "/articoli/" + encodeURIComponent(article.slug);
    const image = coverUrl(article.image);
    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(article.seo_description || article.excerpt)}</description>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      ${article.category ? `<category>${escapeXml(CATEGORY_NAMES[article.category] || article.category)}</category>` : ""}
      ${rfc822(article.date) ? `<pubDate>${rfc822(article.date)}</pubDate>` : ""}
      ${image ? `<media:content url="${escapeXml(image)}" medium="image" type="image/jpeg" width="1200" height="675">${article.imageAlt ? `<media:description>${escapeXml(article.imageAlt)}</media:description>` : ""}</media:content>` : ""}
    </item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Panel Pixel</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Recensioni, monografie, attualità e anteprime su fumetti, videogiochi, cinema, manga e anime.</description>
    <language>it-IT</language>
    <image><url>${SITE_URL}/assets/images/logo-icon.png</url><title>Panel Pixel</title><link>${SITE_URL}/</link></image>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {headers: {"content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate"}});
};
