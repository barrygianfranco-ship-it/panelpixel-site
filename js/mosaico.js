/* Home a mosaico (restyling novembre 2026). Usa ARTICLES e le funzioni di main.js. */
function mosaicoImg(url, width) {
  if (/^https:\/\/cdn\.sanity\.io\//.test(url || "")) return `${url.split("?")[0]}?w=${width}&auto=format&q=80`;
  return typeof storyblokImageUrl === "function" ? storyblokImageUrl(url, width) : url || "";
}

function mosaicoEsc(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function mosaicoFirma(a) {
  const avatar = typeof getAuthorAvatar === "function" ? getAuthorAvatar(a.author) : "";
  const foto = avatar ? `<img src="${avatar}" alt="" loading="lazy">` : "";
  return `<span class="mo-firma">${foto}<span>di <b>${mosaicoEsc(a.author)}</b> · ${formatDateIT(a.date)}</span></span>`;
}

function mosaicoTessera(a, tipo) {
  const largo = tipo === "grande" ? 1400 : 800;
  const sommario = tipo === "grande" ? `<p>${mosaicoEsc(a.excerpt)}</p>` : "";
  return `<a class="mo-tes ${tipo}" href="${articleUrl(a.slug)}"><img src="${mosaicoImg(a.image, largo)}" alt="${mosaicoEsc(a.imageAlt || a.title)}"${tipo === "grande" ? ' fetchpriority="high"' : ' loading="lazy"'}><div class="t"><span class="mo-cat">${getCategoryName(a.category)}</span><h2>${mosaicoEsc(a.title)}</h2>${sommario}</div></a>`;
}

function mosaicoScheda(a) {
  return `<a class="mo-scheda" href="${articleUrl(a.slug)}"><div class="ph"><img src="${mosaicoImg(a.image, 600)}" alt="${mosaicoEsc(a.imageAlt || a.title)}" loading="lazy"></div><div class="t"><span class="mo-cat">${getCategoryName(a.category)}</span><h3>${mosaicoEsc(a.title)}</h3>${mosaicoFirma(a)}</div></a>`;
}

function mosaicoLungo(a) {
  return `<a class="mo-lungo" href="${articleUrl(a.slug)}"><div class="ph"><img src="${mosaicoImg(a.image, 900)}" alt="${mosaicoEsc(a.imageAlt || a.title)}" loading="lazy"></div><div class="t"><span class="mo-cat">${getCategoryName(a.category)}</span><h3>${mosaicoEsc(a.title)}</h3><p>${mosaicoEsc(a.excerpt)}</p>${mosaicoFirma(a)}</div></a>`;
}

function renderMosaico() {
  const wrap = document.getElementById("homepage-grid");
  const mosaico = document.getElementById("mo-mosaico");
  if (!wrap || !mosaico || typeof ARTICLES === "undefined") return;
  wrap.hidden = false;

  const ordinati = [...ARTICLES].sort((a, b) => (a.date < b.date ? 1 : -1));
  const usati = new Set();
  const prendi = (filtro, n) => {
    const scelti = ordinati.filter((a) => !usati.has(a.slug) && filtro(a)).slice(0, n);
    scelti.forEach((a) => usati.add(a.slug));
    return scelti;
  };

  // in apertura i pezzi in evidenza, completati dai più recenti
  const apertura = prendi((a) => a.featured, 4);
  if (apertura.length < 4) apertura.push(...prendi(() => true, 4 - apertura.length));
  const tipi = ["grande", "", "", "largo"];
  mosaico.innerHTML = apertura.map((a, i) => mosaicoTessera(a, tipi[i])).join("");

  const blocco = (id, html) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    el.closest("section").hidden = !html;
  };
  blocco("mo-recensioni", prendi((a) => a.category === "recensioni", 8).map(mosaicoScheda).join(""));
  blocco("mo-lunghi", prendi((a) => ["approfondimenti", "monografie"].includes(a.category), 2).map(mosaicoLungo).join(""));
  blocco("mo-anteprime", prendi((a) => ["anteprime", "attualita"].includes(a.category), 8).map(mosaicoScheda).join(""));
}

// «Cerca» in testata porta alla casella di ricerca della home
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search-input");
  if (!input) return;
  const vai = () => { input.scrollIntoView({ block: "center" }); input.focus(); };
  document.querySelectorAll("[data-mo-cerca]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); vai(); }));
  if (location.hash === "#cerca") vai();
});
