/* ---- Dati dei collaboratori di Panel Pixel ----
   Gestiti qui nel codice (non su Storyblok) per scelta esplicita:
   con solo 1-2 persone è più semplice aggiornare un file che
   mantenere uno schema Storyblok dedicato solo per questo. Se il
   team dovesse crescere parecchio, vale la pena spostarli lì.

   Campi:
   - slug: usato nell'URL della pagina autore (autore.html?nome=<slug>)
   - name: deve corrispondere ESATTAMENTE (case-insensitive) al
     campo "Autore" scritto sui singoli articoli in Storyblok,
     altrimenti il matching articoli↔autore non trova nulla.
   - role: sottotitolo mostrato sotto il nome
   - photo: percorso relativo in assets/images/ — stessa convenzione
     già in uso (assets/images/nome-cognome.jpg)
   - bio: testo libero, una o più frasi
---- */
const AUTHORS = [
  {
    slug: "gianfranco-barry",
    name: "Gianfranco Barry",
    role: "Fondatore",
    photo: "assets/images/gianfranco-barry.jpg",
    bio: "Fondatore di Panel Pixel. Scrivo di fumetti e videogiochi. Sono cresciuto tra i fumetti Bonelli — Tex, Dylan Dog — e i videogiochi della PS2, ed è lì che è nata la mia passione: da allora non ho mai smesso di andare al cinema e di giocare, fino a diventare un appassionato dell'arte videoludica e della sua storia. Studio DAMS, amo la scrittura, i manga e gli anime, e ho un debole per il vecchio cinema italiano, quello dagli anni Quaranta agli anni Ottanta. Mi piace raccontare le mie passioni e fare divulgazione su quello che amo.",
  },
  {
    slug: "pietro-ciuffreda",
    name: "Pietro Ciuffreda",
    role: "Grafica e comunicazione visiva",
    photo: "assets/images/pietro-ciuffreda.jpg",
    bio: "Sono Pietro Ciuffreda, studente di Informatica e appassionato di design, videogiochi, anime, fumetti, cinema e musica. In Panel Pixel mi occupo della parte grafica e della comunicazione visiva del progetto, cercando di costruire un linguaggio riconoscibile e coerente con l'identità della rivista. Ogni tanto contribuisco anche con articoli e riflessioni sulla cultura pop.",
  },
];

function getAuthorBySlug(slug) {
  if (!slug) return null;
  return AUTHORS.find((a) => a.slug === slug) || null;
}

function getAuthorByName(name) {
  if (!name) return null;
  return AUTHORS.find((a) => a.name.toLowerCase() === name.toLowerCase()) || null;
}

// Foto per gli avatar circolari nelle card: se l'autore non è
// (ancora) presente in AUTHORS, ripiega sul simbolo del sito invece
// di mostrare un'immagine rotta.
function getAuthorAvatar(name) {
  const author = getAuthorByName(name);
  return author ? author.photo : "assets/images/logo-icon.png";
}
