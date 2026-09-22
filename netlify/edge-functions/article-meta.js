const STORYBLOK_TOKEN = "zjdMUlID8QrxZOsD4l9W4Qtt";
const SITE_URL = "https://panelpixel.it";

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

export default async (request, context) => {
  const response = await context.next();
  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("slug");

  if (!slug || !response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }

  try {
    // Il sito cerca gli articoli per il campo "slug" del contenuto, che può
    // essere diverso dallo slug della story su Storyblok.
    const storyUrl = new URL("https://api.storyblok.com/v2/cdn/stories");
    storyUrl.searchParams.set("token", STORYBLOK_TOKEN);
    storyUrl.searchParams.set("version", "published");
    storyUrl.searchParams.set("content_type", "articolo");
    storyUrl.searchParams.set("per_page", "1");
    storyUrl.searchParams.set("filter_query[slug][in]", slug);
    const storyResponse = await fetch(storyUrl, { headers: { accept: "application/json" } });
    if (!storyResponse.ok) return response;

    const story = (await storyResponse.json()).stories?.[0];
    if (!story) return response;
    const content = story.content || {};
    const title = content.seo_title || (content.title ? content.title + " | Panel Pixel" : "Panel Pixel");
    const description = content.seo_description || truncate(content.excerpt);
    // Copertina ridimensionata a 1200x630 in JPEG: l'originale può superare
    // di molto il limite di peso delle anteprime social.
    const cover = content.image?.filename;
    const image = cover
      ? (/\.(svg|gif)$/i.test(cover) ? cover : cover + "/m/1200x630/filters:format(jpeg):quality(80)")
      : SITE_URL + "/assets/images/og-default.png";
    const canonical = SITE_URL + "/articolo.html?slug=" + encodeURIComponent(slug);

    let html = await response.text();
    html = html.replace(/<title>.*?<\/title>/i, "<title>" + escapeAttribute(title) + "</title>");
    html = replaceMeta(html, "meta-description", description);
    html = replaceMeta(html, "og-title", title);
    html = replaceMeta(html, "og-description", description);
    html = replaceMeta(html, "og-image", image);
    html = replaceMeta(html, "og-url", canonical);
    html = replaceMeta(html, "twitter-title", title);
    html = replaceMeta(html, "twitter-description", description);
    html = replaceMeta(html, "twitter-image", image);
    html = html.replace(/<link id="canonical-link" rel="canonical" href="[^"]*">/i, '<link id="canonical-link" rel="canonical" href="' + escapeAttribute(canonical) + '">');

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: content.title,
      description,
      image: [image],
      datePublished: content.date,
      dateModified: story.updated_at || content.date,
      author: { "@type": "Person", name: content.author },
      publisher: {
        "@type": "Organization",
        name: "Panel Pixel",
        logo: { "@type": "ImageObject", url: SITE_URL + "/assets/images/logo-icon.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    };
    html = html.replace('<script type="application/ld+json" id="article-jsonld"></script>', '<script type="application/ld+json" id="article-jsonld">' + JSON.stringify(articleSchema).replace(/</g, "\\u003c") + "</script>");

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(html, { status: response.status, headers });
  } catch (error) {
    console.error("article-meta edge function:", error);
    return response;
  }
};
