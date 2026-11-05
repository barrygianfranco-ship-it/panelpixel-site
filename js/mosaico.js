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

// ---- Caroselli Instagram: documenti «caroselloInstagram» pubblicati in Sanity ----
function caroselloHTML(c) {
  const slide = (c.slide || []).filter(Boolean);
  const imgs = slide.map((u, k) => `<img src="${mosaicoImg(u, 640)}" alt="${k ? "" : mosaicoEsc(c.titolo)}" loading="lazy"${k ? "" : ' class="on"'}>`).join("");
  const frecce = slide.length > 1 ? '<button type="button" class="p" aria-label="Slide precedente">‹</button><button type="button" class="n" aria-label="Slide successiva">›</button>' : "";
  const link = c.link || "https://www.instagram.com/panelpixel.it/";
  return `<p class="ig-etichetta">Su Instagram</p><div class="ig-car">${imgs}${frecce}</div><div class="ig-punti">${"<i></i>".repeat(slide.length)}</div><p class="ig-tit">${mosaicoEsc(c.titolo)}</p><a class="ig-link" href="${mosaicoEsc(link)}" target="_blank" rel="noopener">Apri su Instagram →</a>`;
}

function attivaCarosello(box) {
  const im = box.querySelectorAll(".ig-car img"), pu = box.querySelectorAll(".ig-punti i");
  if (!im.length) return;
  let i = 0; pu[0]?.classList.add("on");
  const vai = (d) => { im[i].classList.remove("on"); pu[i]?.classList.remove("on"); i = (i + d + im.length) % im.length; im[i].classList.add("on"); pu[i]?.classList.add("on"); };
  box.querySelector(".p")?.addEventListener("click", () => vai(-1));
  box.querySelector(".n")?.addEventListener("click", () => vai(1));
}

function renderCaroselliInstagram(caroselli) {
  const scelti = ["sinistra", "destra"].map((pos) => caroselli.find((c) => c.posizione === pos)).filter((c) => c && c.slide && c.slide.length);
  if (!scelti.length) return;
  const piede = document.querySelector(".site-footer");
  scelti.forEach((c) => {
    const lato = document.createElement("aside");
    lato.className = `ig-lato ${c.posizione}`;
    lato.setAttribute("aria-label", `Su Instagram: ${c.titolo}`);
    lato.innerHTML = caroselloHTML(c);
    document.body.insertBefore(lato, piede);
    attivaCarosello(lato);
  });
  const fascia = document.createElement("section");
  fascia.className = "mo-blocco ig-fascia";
  fascia.innerHTML = `<div class="mo-blocco-testa"><h2>Dal nostro Instagram</h2><a href="https://www.instagram.com/panelpixel.it/" target="_blank" rel="noopener">Seguici</a></div><div class="ig-griglia">${scelti.map((c) => `<div>${caroselloHTML(c)}</div>`).join("")}</div>`;
  document.getElementById("newsletter")?.before(fascia);
  fascia.querySelectorAll(".ig-griglia > div").forEach(attivaCarosello);
}

async function caricaCaroselliInstagram() {
  const query = '*[_type == "caroselloInstagram" && attivo != false] | order(_updatedAt desc){titolo, link, posizione, "slide": slide[].asset->url}';
  const url = `https://np9ttr0b.apicdn.sanity.io/v2026-10-17/data/query/production?query=${encodeURIComponent(query)}&perspective=published`;
  try {
    const risposta = await fetch(url);
    if (!risposta.ok) return;
    renderCaroselliInstagram((await risposta.json()).result || []);
  } catch (err) {
    console.warn("Caroselli Instagram non disponibili:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mo-mosaico")) caricaCaroselliInstagram();
});
