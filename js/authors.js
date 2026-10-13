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
   - links: facoltativo, elenco di { label, url } mostrato sotto la bio
     (profili social, canale, sito personale). Solo indirizzi che la
     persona ha scelto di rendere pubblici.
---- */
const AUTHORS = [
  {
    slug: "gianfranco-barry",
    name: "Gianfranco Barry",
    role: "Fondatore",
    photo: "assets/images/gianfranco-barry.jpg",
    bio: "Fondatore di Panel Pixel. Scrivo di fumetti e videogiochi. Sono cresciuto tra i fumetti Bonelli, Tex e Dylan Dog, e i videogiochi della PS2, ed è lì che è nata la mia passione: da allora non ho mai smesso di andare al cinema e di giocare, fino a diventare un appassionato dell'arte videoludica e della sua storia. Studio DAMS, amo la scrittura, i manga e gli anime, e ho un debole per il vecchio cinema italiano, quello dagli anni Quaranta agli anni Ottanta. Mi piace raccontare le mie passioni e fare divulgazione su quello che amo.",
  },
  {
    slug: "pietro-ciuffreda",
    name: "Pietro Ciuffreda",
    role: "Grafica e comunicazione visiva",
    photo: "assets/images/pietro-ciuffreda.jpg",
    bio: "Sono Pietro Ciuffreda, studente di Informatica e appassionato di design, videogiochi, anime, fumetti, cinema e musica. In Panel Pixel mi occupo della parte grafica e della comunicazione visiva del progetto, cercando di costruire un linguaggio riconoscibile e coerente con l'identità della rivista. Ogni tanto contribuisco anche con articoli e riflessioni sulla cultura pop.",
  },
  {
    slug: "graziano-ferilli",
    name: "Graziano Ferilli",
    role: "Videogiochi",
    photo: "assets/images/graziano-ferilli.jpg",
    bio: "Classe 1995, videogiocatore da tempo immemore. Il mio primo gioco è stato Pokémon Blu, come per tanti della mia generazione, ma quello che pareva essere un semplice passatempo è presto diventato passione di una vita. Laureato in traduzione, lavoro per diventare localizzatore di videogiochi.",
    links: [{ label: "YouTube", url: "https://www.youtube.com/@Akio_TheCouch" }],
  },
  {
    slug: "noma",
    name: "NoMa",
    role: "Manga e fumetti",
    photo: "assets/images/noma.jpg",
    bio: "Mi hanno chiesto di presentarmi, quindi quella che segue è una presentazione perfettamente chiara e coerente. Sono la persona che strapazza le idee. Le prendo e le faccio uscire dal loro guscio; poi le ribalto, aggiungo altre idee di cui non c’era assolutamente bisogno e infine creo qualcosa di vagamente sensato. La mia concezione di personal branding è fare spuntini abbinati alla lettura del momento: Panel Pixel non è stato maltrattato durante il procedimento. Qui è NoMa, lettrice di manga e fumetti che ama le vecchie edizioni e sovrainterpretare qualsiasi cosa.",
  },
  {
    slug: "antonio-fragomeni",
    name: "Antonio Fragomeni",
    role: "Videogiochi, arte e gamification",
    photo: "assets/images/antonio-fragomeni.jpg",
    bio: "Laureato in beni culturali, sono cresciuto con Zelda e Final Fantasy e vedo i videogiochi come un grande medium per la trasmissione della cultura. Scrivo di videogiochi, arte, storia e gamification. Se non mi trovate in redazione, probabilmente sono perso nel Faerûn.",
    links: [{ label: "LinkedIn", url: "https://www.linkedin.com/in/antonio-fragomeni" }],
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
