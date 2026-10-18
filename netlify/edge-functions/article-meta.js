const STORYBLOK_TOKEN = "zjdMUlID8QrxZOsD4l9W4Qtt";
const SITE_URL = "https://panelpixel.it";
const SANITY_PROJECT_ID = "np9ttr0b";
const SANITY_API_VERSION = "2026-10-17";
const SANITY_PRODUCTION_DATASET = "production";

function escapeAttribute(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function truncate(value, length = 160) {
  const text = String(value || "").trim();
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trim() + "…";
}
function replaceMeta(html, id, value) {
  const pattern = new RegExp('(<meta[^>]+id="' + id + '"[^>]+content=")[^"]*(")', "i");
  return html.replace(pattern, "$1" + escapeAttribute(value) + "$2");
}
const CATEGORY_NAMES = {recensioni: "Recensioni", monografie: "Monografie", attualita: "Attualità", anteprime: "Anteprime", approfondimenti: "Approfondimenti"};

// "2026-10-16" o "2026-10-16 00:00" → "2026-10-16T00:00:00+02:00" (ora italiana), come chiede schema.org.
function isoDate(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?$/);
  if (!match) return value || undefined;
  const local = match[1] + "T" + (match[2] || "00:00") + ":00";
  const offset = new Intl.DateTimeFormat("en-US", {timeZone: "Europe/Rome", timeZoneName: "longOffset"})
    .formatToParts(new Date(local + "Z")).find((part) => part.type === "timeZoneName")?.value.replace("GMT", "") || "+00:00";
  return local + offset;
}
function sanitySocialImage(url) {
  if (!url) return "";
  const image = new URL(url);
  image.searchParams.set("w", "1200"); image.searchParams.set("h", "630");
  image.searchParams.set("fit", "crop"); image.searchParams.set("fm", "jpg"); image.searchParams.set("q", "80");
  return image.toString();
}
async function storyblokMetadata(slug) {
  const url = new URL("https://api.storyblok.com/v2/cdn/stories");
  url.searchParams.set("token", STORYBLOK_TOKEN); url.searchParams.set("version", "published");
  url.searchParams.set("content_type", "articolo"); url.searchParams.set("per_page", "1");
  url.searchParams.set("filter_query[slug][in]", slug);
  const response = await fetch(url, {headers: {accept: "application/json"}});
  if (!response.ok) return null;
  const story = (await response.json()).stories?.[0];
  if (!story) return {notFound: true};
  const content = story.content || {}; const cover = content.image?.filename;
  return {
    title: content.seo_title || (content.title ? content.title + " | Panel Pixel" : "Panel Pixel"),
    headline: content.title, description: content.seo_description || truncate(content.excerpt),
    image: cover ? (/\.(svg|gif)$/i.test(cover) ? cover : cover + "/m/1200x630/filters:format(jpeg):quality(80)") : "",
    datePublished: content.date, dateModified: story.updated_at || content.date, author: content.author, category: content.category,
  };
}
function usesPrivateStaging(requestUrl) {
  return ["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)
    || requestUrl.searchParams.get("sanity-dataset") === "staging";
}
async function sanityMetadata(requestUrl, slug) {
  const url = usesPrivateStaging(requestUrl)
    ? new URL("/api/sanity-content", requestUrl.origin)
    : new URL(`https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_PRODUCTION_DATASET}`);
  if (usesPrivateStaging(requestUrl)) {
    url.searchParams.set("slug", slug);
  } else {
    url.searchParams.set("query", '*[_type == "articolo" && stato == "approvato" && slug.current == $slug][0]{...,image{...,asset->{url}}}');
    url.searchParams.set("$slug", JSON.stringify(slug));
    url.searchParams.set("perspective", "published");
  }
  const response = await fetch(url, {headers: {accept: "application/json"}});
  if (!response.ok) return null;
  const payload = await response.json();
  const content = usesPrivateStaging(requestUrl) ? payload.document : payload.result;
  if (!content) return {notFound: true};
  return {
    title: content.seo_title || (content.title ? content.title + " | Panel Pixel" : "Panel Pixel"),
    headline: content.title, description: content.seo_description || truncate(content.excerpt),
    image: sanitySocialImage(content.image?.asset?.url), datePublished: content.date,
    dateModified: content._updatedAt || content.date, author: content.author, category: content.category,
  };
}

export default async (request, context) => {
  const response = await context.next();
  const requestUrl = new URL(request.url); const slug = requestUrl.searchParams.get("slug");
  if (!slug || !response.headers.get("content-type")?.includes("text/html")) return response;
  try {
    // Anche in modalità anteprima i meta pubblici leggono esclusivamente la versione pubblicata.
    const metadata = requestUrl.searchParams.get("cms") === "storyblok" ? await storyblokMetadata(slug) : await sanityMetadata(requestUrl, slug);
    if (!metadata) return response;
    if (metadata.notFound) {
      // Slug inesistente: stessa pagina (il JS mostra «articolo non trovato»), ma con 404 e noindex.
      const html = (await response.text()).replace("</head>", '  <meta name="robots" content="noindex">' + "\n</head>");
      const headers = new Headers(response.headers); headers.delete("content-length");
      return new Response(html, {status: 404, headers});
    }
    const title = metadata.title; const description = metadata.description;
    const image = metadata.image || SITE_URL + "/assets/images/og-default.png";
    const canonical = SITE_URL + "/articolo.html?slug=" + encodeURIComponent(slug);
    let html = await response.text();
    html = html.replace(/<title>.*?<\/title>/i, "<title>" + escapeAttribute(title) + "</title>");
    for (const [id, value] of [["meta-description", description], ["og-title", title], ["og-description", description], ["og-image", image], ["og-url", canonical], ["twitter-title", title], ["twitter-description", description], ["twitter-image", image]]) html = replaceMeta(html, id, value);
    html = html.replace(/<link id="canonical-link" rel="canonical" href="[^"]*">/i, '<link id="canonical-link" rel="canonical" href="' + escapeAttribute(canonical) + '">');
    const articleSchema = {
      "@context": "https://schema.org", "@type": "Article", headline: metadata.headline,
      description, image: [image], datePublished: isoDate(metadata.datePublished), dateModified: isoDate(metadata.dateModified),
      author: {"@type": "Person", name: metadata.author},
      publisher: {"@type": "Organization", name: "Panel Pixel", logo: {"@type": "ImageObject", url: SITE_URL + "/assets/images/logo-icon.png"}},
      mainEntityOfPage: {"@type": "WebPage", "@id": canonical},
    };
    const breadcrumbItems = [{"@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/index.html"}];
    if (CATEGORY_NAMES[metadata.category]) breadcrumbItems.push({"@type": "ListItem", position: 2, name: CATEGORY_NAMES[metadata.category], item: SITE_URL + "/" + metadata.category + ".html"});
    breadcrumbItems.push({"@type": "ListItem", position: breadcrumbItems.length + 1, name: metadata.headline, item: canonical});
    const breadcrumbSchema = {"@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbItems};
    html = html.replace('<script type="application/ld+json" id="breadcrumb-jsonld"></script>', '<script type="application/ld+json" id="breadcrumb-jsonld">' + JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") + "</script>");
    html = html.replace('<script type="application/ld+json" id="article-jsonld"></script>', '<script type="application/ld+json" id="article-jsonld">' + JSON.stringify(articleSchema).replace(/</g, "\\u003c") + "</script>");
    const headers = new Headers(response.headers); headers.delete("content-length"); headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(html, {status: response.status, headers});
  } catch (error) {
    console.error("article-meta edge function:", error); return response;
  }
};
