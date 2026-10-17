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
  if (!story) return null;
  const content = story.content || {}; const cover = content.image?.filename;
  return {
    title: content.seo_title || (content.title ? content.title + " | Panel Pixel" : "Panel Pixel"),
    headline: content.title, description: content.seo_description || truncate(content.excerpt),
    image: cover ? (/\.(svg|gif)$/i.test(cover) ? cover : cover + "/m/1200x630/filters:format(jpeg):quality(80)") : "",
    datePublished: content.date, dateModified: story.updated_at || content.date, author: content.author,
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
  if (!content) return null;
  return {
    title: content.seo_title || (content.title ? content.title + " | Panel Pixel" : "Panel Pixel"),
    headline: content.title, description: content.seo_description || truncate(content.excerpt),
    image: sanitySocialImage(content.image?.asset?.url), datePublished: content.date,
    dateModified: content._updatedAt || content.date, author: content.author,
  };
}

export default async (request, context) => {
  const response = await context.next();
  const requestUrl = new URL(request.url); const slug = requestUrl.searchParams.get("slug");
  if (!slug || !response.headers.get("content-type")?.includes("text/html")) return response;
  try {
    // Anche in modalità anteprima i meta pubblici leggono esclusivamente la versione pubblicata.
    const metadata = requestUrl.searchParams.get("cms") === "sanity" ? await sanityMetadata(requestUrl, slug) : await storyblokMetadata(slug);
    if (!metadata) return response;
    const title = metadata.title; const description = metadata.description;
    const image = metadata.image || SITE_URL + "/assets/images/og-default.png";
    const canonical = SITE_URL + "/articolo.html?slug=" + encodeURIComponent(slug);
    let html = await response.text();
    html = html.replace(/<title>.*?<\/title>/i, "<title>" + escapeAttribute(title) + "</title>");
    for (const [id, value] of [["meta-description", description], ["og-title", title], ["og-description", description], ["og-image", image], ["og-url", canonical], ["twitter-title", title], ["twitter-description", description], ["twitter-image", image]]) html = replaceMeta(html, id, value);
    html = html.replace(/<link id="canonical-link" rel="canonical" href="[^"]*">/i, '<link id="canonical-link" rel="canonical" href="' + escapeAttribute(canonical) + '">');
    const articleSchema = {
      "@context": "https://schema.org", "@type": "Article", headline: metadata.headline,
      description, image: [image], datePublished: metadata.datePublished, dateModified: metadata.dateModified,
      author: {"@type": "Person", name: metadata.author},
      publisher: {"@type": "Organization", name: "Panel Pixel", logo: {"@type": "ImageObject", url: SITE_URL + "/assets/images/logo-icon.png"}},
      mainEntityOfPage: {"@type": "WebPage", "@id": canonical},
    };
    html = html.replace('<script type="application/ld+json" id="article-jsonld"></script>', '<script type="application/ld+json" id="article-jsonld">' + JSON.stringify(articleSchema).replace(/</g, "\\u003c") + "</script>");
    const headers = new Headers(response.headers); headers.delete("content-length"); headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(html, {status: response.status, headers});
  } catch (error) {
    console.error("article-meta edge function:", error); return response;
  }
};
