/* ==========================================================================
   Panel Pixel — dati del sito
   Per aggiungere/modificare articoli, modifica l'array ARTICLES qui sotto.
   Vedi README.md per le istruzioni dettagliate.
   ========================================================================== */

const SITE = {
  name: "Panel Pixel",
  tagline: "Fumetti, videogiochi e cultura pop, un frame alla volta.",
  email: "redazione@panelpixel.it",
  // Dominio pubblico del sito, usato per comporre og:url e og:image (le
  // anteprime che compaiono quando condividi un link su social/chat/WhatsApp)
  // — vedi updateArticleSEO in js/main.js. NESSUNO slash finale.
  //
  // QUANDO IL DOMINIO panelpixel.it SARÀ ATTIVO: qui deve esserci esattamente
  //   url: "https://panelpixel.it"
  // (è già impostato così qui sotto). Finché il dominio non è registrato e
  // puntato al sito, questo valore resta corretto ma "a vuoto": non causa
  // errori, semplicemente le anteprime social punteranno a un indirizzo non
  // ancora raggiungibile. Vedi la sezione "Quando il dominio è attivo" nel
  // README.md per i controlli da fare una volta che panelpixel.it risponde.
  url: "https://panelpixel.it",
};

const CATEGORIES = [
  { slug: "recensioni", name: "Recensioni" },
  { slug: "monografie", name: "Monografie" },
  { slug: "attualita", name: "Attualità" },
  { slug: "anteprime", name: "Anteprime" },
];

/* ==========================================================================
   Commenti (Giscus) — configurazione
   Panel Pixel non ha un backend proprio per i commenti: usa Giscus
   (https://giscus.app), un widget gratuito basato sulle GitHub Discussions
   di un repository pubblico. Finché "enabled" è false, in fondo agli
   articoli compare solo un messaggio placeholder e NESSUNO script esterno
   viene caricato (nessuna richiesta a giscus.app, nessun cookie di terze
   parti) — coerente con quanto dichiarato in privacy.html.

   Come attivarlo:
   1. Crea (o usa) un repository PUBBLICO su GitHub, anche vuoto — es.
      github.com/tuo-utente/panel-pixel — e attiva "Discussions" in
      Settings → General → Features del repository.
   2. Installa la GitHub App di giscus sul repository:
      https://github.com/apps/giscus
   3. Vai su https://giscus.app, inserisci il nome del repository
      (formato "utente/nome-repo") nel campo in alto: la pagina genera
      automaticamente i valori "data-repo-id" e "data-category-id" da
      copiare qui sotto.
   4. Sostituisci repo / repoId / category / categoryId qui sotto con quei
      valori (categoria consigliata: "Commenti", oppure quella che preferisci
      tra le Discussions categories del repo).
   5. Imposta enabled: true.

   Nota sul "mapping": impostato su "pathname" su richiesta esplicita.
   ATTENZIONE — tutte le pagine articolo condividono lo stesso indirizzo
   articolo.html?slug=... e "pathname" ignora la query string: significa
   che TUTTI gli articoli del sito condividono la STESSA discussione GitHub
   (un unico thread di commenti per l'intero sito, non uno per articolo).
   Se in futuro si vuole un thread separato per ogni articolo, l'alternativa
   è "specific" con "data-term" impostato sullo slug dell'articolo.
*/
const COMMENTS_CONFIG = {
  provider: "giscus",
  enabled: true,
  giscus: {
    repo: "barrygianfranco-ship-it/panelpixel-site",
    repoId: "R_kgDOTweA-Q",
    category: "General",
    categoryId: "DIC_kwDOTweA-c4DC01r",
  },
};

/* Ogni articolo:
   - slug: identificativo univoco usato nell'URL (articolo.html?slug=...)
   - category: deve corrispondere a uno slug in CATEGORIES (sezione del sito:
     recensioni / monografie / attualita / anteprime)
   - type: determina il TEMPLATE/layout della pagina articolo (vedi
     renderArticleLayout in js/main.js). Uno tra:
       "recensione", "monografia", "notizia" → content è un ARRAY DI BLOCCHI,
         mostrati in ordine, di due tipi possibili:
           { type: "paragraph", heading (opzionale), text }
             → un paragrafo di testo; "heading" genera un intertitolo (di
               solito lasciato vuoto solo nel primo blocco, che fa da attacco)
           { type: "image", src, alt (opzionale), caption (opzionale) }
             → un'immagine in mezzo al testo, con didascalia opzionale
         Si possono alternare liberamente: testo, immagine, testo, immagine...
         (Sono supportati anche i formati usati prima di avere i blocchi
         misti — una stringa semplice, oppure { heading (opz.), text } senza
         "type" — per compatibilità con gli articoli scritti in precedenza.)
       "radar" → rubrica con più voci (es. giochi/film da tenere d'occhio).
         content è un OGGETTO { intro, items }, dove items è un array di
         { title, creator, publisher, releaseInfo, why }.
   - featured: true per farlo comparire nella sezione "In evidenza" in home
   - image: percorso dell'immagine di copertina
   - triedOn: (opzionale) piattaforma/contesto della prova — es. "PC (build
     review)". Se presente, compare in fondo alla pagina come "Provato su ...".
   - seoTitle: titolo per <title>, og:title e twitter:title (opzionale)
   - seoDescription: testo per meta description, og:description e twitter:description (opzionale)
   - seoKeywords: array di parole chiave per il meta tag keywords (opzionale)
   Se seoTitle/seoDescription non sono compilati, main.js usa in automatico
   title ed excerpt come fallback (vedi updateArticleSEO in js/main.js).
*/
const ARTICLES = [
  {
    slug: "nova-terra-open-world-che-respira",
    category: "recensioni",
    type: "recensione",
    title: "Nova Terra: un open world che respira",
    excerpt: "Un mondo aperto che non ha paura del silenzio: la recensione del titolo open world più discusso dell'estate.",
    author: "Gianfranco Barry",
    date: "2026-08-04",
    image: "assets/images/nova-terra-open-world-che-respira.svg",
    featured: true,
    triedOn: "PC (build review), disponibile anche su console.",
    seoTitle: "Nova Terra: recensione del nuovo open world | Panel Pixel",
    seoDescription: "Recensione completa di Nova Terra: mondo aperto, level design e difetti tecnici del titolo open world più discusso dell'estate.",
    seoKeywords: ["nova terra recensione", "open world 2026", "recensione videogiochi", "nova terra gioco"],
    content: [
      { type: "paragraph", text: "Nova Terra arriva dopo tre anni di sviluppo e la sensazione, fin dalle prime ore, è quella di trovarsi davanti a un progetto che sa esattamente cosa vuole essere: non un contenitore di attività da spuntare, ma un ecosistema che respira con ritmi propri." },
      { type: "paragraph", heading: "Un level design che premia l'osservazione", text: "Il level design premia l'osservazione più che la fretta: le missioni principali si intrecciano con una mappa che cambia aspetto a seconda del meteo e dell'ora, e ogni villaggio racconta una piccola storia indipendente dalla trama centrale." },
      { type: "paragraph", heading: "I limiti tecnici", text: "Non tutto funziona: il comparto tecnico su hardware meno recente soffre cali di frame rate nelle aree più affollate, e alcune meccaniche di crafting risultano ridondanti dopo le prime dieci ore. Restano difetti marginali in un'esperienza che ridefinisce lo standard del genere." },
    ],
  },
  {
    slug: "il-ritorno-del-cavaliere",
    category: "recensioni",
    type: "recensione",
    title: "Il Ritorno del Cavaliere: quando il fumetto diventa mito",
    excerpt: "Un graphic novel che riporta il supereroe alle sue radici più oscure, tra disegno essenziale e sceneggiatura spietata.",
    author: "Gianfranco Barry",
    date: "2026-07-28",
    image: "assets/images/il-ritorno-del-cavaliere.svg",
    featured: false,
    seoTitle: "Il Ritorno del Cavaliere: recensione del graphic novel | Panel Pixel",
    seoDescription: "La recensione de Il Ritorno del Cavaliere, il graphic novel che riporta il supereroe alle sue radici più oscure e teatrali.",
    seoKeywords: ["il ritorno del cavaliere", "recensione fumetto supereroistico", "graphic novel 2026", "fumetto dark"],
    content: [
      { type: "paragraph", text: "Dopo un decennio di assenza, il personaggio torna in un volume che rifiuta la spettacolarità per abbracciare un registro quasi teatrale: poche pagine, molte pause, un uso del bianco che diventa esso stesso narrazione." },
      { type: "paragraph", heading: "Un tratto che rifiuta il patinato", text: "Il tratto, volutamente grezzo, si allontana dal realismo patinato a cui il pubblico è abituato, restituendo un'urgenza espressiva che ricorda i maestri del fumetto d'autore più che il mainstream supereroistico." },
      { type: "paragraph", heading: "Una sceneggiatura senza sconti", text: "La sceneggiatura non concede sconti: i dialoghi sono ridotti all'osso e le scelte del protagonista lasciano un retrogusto amaro fino all'ultima tavola. Un'opera che divide, ma che non si dimentica facilmente." },
    ],
  },
  {
    slug: "frequenze-perdute-serie",
    category: "recensioni",
    type: "recensione",
    title: "Frequenze Perdute: la serie che riscrive il coming-of-age",
    excerpt: "La serie che riscrive le regole del coming-of-age televisivo, tra ellissi narrative e una colonna sonora che diventa personaggio.",
    author: "Gianfranco Barry",
    date: "2026-07-15",
    image: "assets/images/frequenze-perdute-serie.svg",
    featured: false,
    seoTitle: "Frequenze Perdute: recensione della serie tv | Panel Pixel",
    seoDescription: "Recensione di Frequenze Perdute: come la serie riscrive il coming-of-age tra ellissi narrative e colonna sonora.",
    seoKeywords: ["frequenze perdute recensione", "serie tv coming of age", "recensione serie tv 2026"],
    content: [
      { type: "paragraph", text: "Otto episodi bastano a Frequenze Perdute per costruire un affresco generazionale che evita ogni scorciatoia sentimentale, affidandosi a una regia che lascia respirare i silenzi tra i protagonisti." },
      { type: "paragraph", heading: "La scrittura per sottrazione", text: "La scrittura procede per sottrazione: quello che non viene detto pesa quanto i dialoghi, e le ellissi temporali costringono lo spettatore a colmare i vuoti con la propria memoria adolescenziale." },
      { type: "paragraph", heading: "Il montaggio sonoro come personaggio", text: "Il vero protagonista, però, è il montaggio sonoro: ogni episodio prende il nome da una canzone che ne definisce l'umore, in un esperimento che raramente cade nella citazione fine a sé stessa." },
    ],
  },
  {
    slug: "moebius-arte-del-silenzio",
    category: "monografie",
    type: "monografia",
    title: "Moebius e l'arte del silenzio disegnato",
    excerpt: "Un percorso attraverso l'opera del maestro francese, tra paesaggi impossibili e una linea che ha cambiato la storia del fumetto.",
    author: "Gianfranco Barry",
    date: "2026-08-03",
    image: "assets/images/moebius-arte-del-silenzio.svg",
    featured: true,
    seoTitle: "Moebius: vita e opere del maestro del fumetto | Panel Pixel",
    seoDescription: "Monografia su Moebius (Jean Giraud): dal western di Blueberry alla fantascienza de L'Incal, il percorso che ha cambiato il fumetto.",
    seoKeywords: ["moebius fumetto", "jean giraud", "l'incal", "storia del fumetto francese"],
    content: [
      { type: "paragraph", text: "Pochi autori hanno saputo trasformare il tratto in atmosfera come Jean Giraud, in arte Moebius: le sue tavole non illustrano un mondo, lo evocano, sospendendo il lettore in spazi che sembrano esistere prima ancora di essere disegnati." },
      { type: "paragraph", text: "Il percorso che lo porta dal western disegnato con Blueberry alla fantascienza visionaria de L'Incal segna una delle transizioni più radicali nella storia della disciplina, senza mai perdere la coerenza di uno sguardo autoriale." },
      { type: "paragraph", text: "A distanza di anni dalla sua scomparsa, l'influenza di Moebius resta visibile in tre generazioni di autori, dal fumetto giapponese al concept design cinematografico: la prova che una linea, se abbastanza precisa, può attraversare i decenni." },
    ],
  },
  {
    slug: "miyazaki-trent-anni-di-mondi",
    category: "monografie",
    type: "monografia",
    title: "Hayao Miyazaki: trent'anni di mondi sospesi",
    excerpt: "Dalle prime opere allo Studio Ghibli: come un regista ha costruito un immaginario riconoscibile in tre secondi di inquadratura.",
    author: "Gianfranco Barry",
    date: "2026-07-25",
    image: "assets/images/miyazaki-trent-anni-di-mondi.svg",
    featured: false,
    seoTitle: "Hayao Miyazaki: trent'anni di cinema d'animazione | Panel Pixel",
    seoDescription: "Un percorso nella filmografia di Hayao Miyazaki, tra Studio Ghibli, infanzia e volo: i temi che attraversano quarant'anni di carriera.",
    seoKeywords: ["hayao miyazaki", "studio ghibli", "animazione giapponese", "monografia regista"],
    content: [
      { type: "paragraph", text: "Ci sono registi che si riconoscono da un'inquadratura, e Hayao Miyazaki è tra questi: un cielo, una nuvola, un campo di grano in movimento bastano a firmare un'opera senza bisogno di titoli di testa." },
      { type: "paragraph", text: "Il suo cinema si muove costantemente tra infanzia e responsabilità, tra il desiderio di volare e la necessità di restare con i piedi per terra, in una tensione che attraversa quarant'anni di filmografia senza mai risolversi del tutto." },
      { type: "paragraph", text: "Ripercorrere la sua carriera oggi significa anche interrogarsi su cosa resterà dell'animazione disegnata a mano in un'industria sempre più dominata dal digitale: una domanda a cui lo stesso regista non ha mai smesso di rispondere, film dopo film." },
    ],
  },
  {
    slug: "chrono-valley-anatomia-di-un-culto",
    category: "monografie",
    type: "monografia",
    title: "La saga di Chrono Valley: anatomia di un culto videoludico",
    excerpt: "Come un piccolo RPG uscito quasi in sordina è diventato uno dei riferimenti più citati del genere.",
    author: "Gianfranco Barry",
    date: "2026-07-10",
    image: "assets/images/chrono-valley-anatomia-di-un-culto.svg",
    featured: false,
    seoTitle: "Chrono Valley: storia di un culto videoludico | Panel Pixel",
    seoDescription: "Come Chrono Valley, RPG uscito quasi in sordina, sia diventato uno dei titoli più citati e influenti del genere.",
    seoKeywords: ["chrono valley", "rpg indipendente", "videogiochi cult", "monografia videogioco"],
    content: [
      { type: "paragraph", text: "Quando Chrono Valley uscì, quasi nessuno scommetteva sul suo successo: un team ridotto, un budget minimo, un sistema di combattimento considerato all'epoca troppo lento per il mercato." },
      { type: "paragraph", text: "Eppure qualcosa nel modo in cui il gioco trattava il tempo, la perdita e la memoria dei personaggi ha continuato a lavorare nell'immaginario dei giocatori ben oltre l'uscita, trasformandolo in un riferimento citato da una generazione di sviluppatori indipendenti." },
      { type: "paragraph", text: "Oggi, a distanza di anni, il suo linguaggio visivo minimale e la scrittura non lineare sono diventati un piccolo manuale di stile per chi vuole raccontare storie complesse con mezzi limitati." },
    ],
  },
  {
    slug: "intelligenza-artificiale-nei-comics",
    category: "attualita",
    type: "notizia",
    title: "L'intelligenza artificiale nei comics: strumento o minaccia?",
    excerpt: "Tra strumenti di produzione e timori sul lavoro degli autori, il dibattito nell'industria del fumetto si fa sempre più acceso.",
    author: "Gianfranco Barry",
    date: "2026-07-30",
    image: "assets/images/intelligenza-artificiale-nei-comics.svg",
    featured: true,
    seoTitle: "Intelligenza artificiale nei fumetti: rischio o opportunità? | Panel Pixel",
    seoDescription: "Il dibattito sull'uso dell'intelligenza artificiale generativa nel fumetto: strumenti di produzione, crediti e autorialità.",
    seoKeywords: ["intelligenza artificiale fumetti", "ia generativa comics", "futuro del fumetto", "editoria e ia"],
    content: [
      { type: "paragraph", text: "Negli ultimi mesi diverse case editrici hanno iniziato a sperimentare strumenti di intelligenza artificiale generativa per fasi come il lettering o gli sfondi, riaprendo un dibattito che il settore editoriale non aveva mai davvero chiuso." },
      { type: "paragraph", text: "Le associazioni di categoria chiedono trasparenza sui crediti e garanzie contrattuali, mentre alcuni autori indipendenti vedono in questi strumenti una possibilità concreta di ridurre i tempi di produzione senza rinunciare al controllo creativo." },
      { type: "paragraph", text: "Il nodo centrale resta lo stesso da anni: chi decide dove finisce lo strumento e comincia l'autorialità? Una domanda che il fumetto condivide, oggi più che mai, con il cinema e la musica." },
    ],
  },
  {
    slug: "il-festival-del-fumetto-cambia-casa",
    category: "attualita",
    type: "notizia",
    title: "Il festival del fumetto cambia casa",
    excerpt: "Il trasferimento della manifestazione in una nuova sede apre interrogativi su costi, accessibilità e futuro degli autori indipendenti.",
    author: "Gianfranco Barry",
    date: "2026-07-20",
    image: "assets/images/il-festival-del-fumetto-cambia-casa.svg",
    featured: false,
    seoTitle: "Il festival del fumetto cambia sede: cosa cambia | Panel Pixel",
    seoDescription: "Il festival del fumetto trasloca in una nuova sede: costi, spazi e reazioni degli autori indipendenti a confronto.",
    seoKeywords: ["festival del fumetto", "fiere del fumetto", "autori indipendenti", "eventi fumetto 2026"],
    content: [
      { type: "paragraph", text: "L'annuncio è arrivato senza troppi preavvisi: il festival, per anni identificato con la sua sede storica, si sposterà in un nuovo polo fieristico a partire dalla prossima edizione." },
      { type: "paragraph", text: "Per gli editori maggiori la notizia è accolta con favore, viste le maggiori superfici disponibili; per gli autori indipendenti, che negli anni avevano costruito un pubblico proprio negli spazi più informali della vecchia location, la preoccupazione riguarda soprattutto i costi degli stand." },
      { type: "paragraph", text: "Gli organizzatori promettono aree dedicate all'autoproduzione a tariffe calmierate, ma la comunità resta divisa tra l'entusiasmo per gli spazi più ampi e il timore di perdere l'identità che aveva reso il festival unico." },
    ],
  },
  {
    slug: "streaming-e-serialita-settimanale",
    category: "attualita",
    type: "notizia",
    title: "Streaming e serialità: il ritorno dell'episodio settimanale",
    excerpt: "Dopo anni di uscite complete in un solo giorno, sempre più piattaforme tornano al rilascio episodio per episodio.",
    author: "Gianfranco Barry",
    date: "2026-07-05",
    image: "assets/images/streaming-e-serialita-settimanale.svg",
    featured: false,
    seoTitle: "Streaming: perché torna la serialità settimanale | Panel Pixel",
    seoDescription: "Perché sempre più piattaforme streaming abbandonano il rilascio in blocco e tornano alla pubblicazione episodio per episodio.",
    seoKeywords: ["streaming serialità", "uscite settimanali serie tv", "piattaforme streaming 2026"],
    content: [
      { type: "paragraph", text: "Il ritorno alla pubblicazione settimanale, dopo anni di stagioni intere rilasciate in blocco, non è un caso isolato ma una tendenza che sta ridisegnando le strategie delle principali piattaforme streaming." },
      { type: "paragraph", text: "I dati sul tempo di permanenza degli abbonati raccontano una storia chiara: le serie distribuite settimanalmente generano conversazione prolungata sui social e riducono il tasso di abbandono degli abbonamenti nei mesi successivi al lancio." },
      { type: "paragraph", text: "Resta da capire se questo cambio di rotta sia una scelta editoriale duratura o semplicemente una risposta tattica a un mercato della disattenzione sempre più affollato e competitivo." },
    ],
  },
  {
    slug: "distretto-nove-prima-occhiata",
    category: "anteprime",
    type: "notizia",
    title: "Distretto Nove: il primo sguardo al nuovo fumetto distopico",
    excerpt: "Il primo sguardo al nuovo fumetto distopico che promette di riportare la fantascienza sociale al centro del catalogo.",
    author: "Gianfranco Barry",
    date: "2026-07-22",
    image: "assets/images/distretto-nove-prima-occhiata.svg",
    featured: true,
    seoTitle: "Distretto Nove: anteprima del nuovo fumetto distopico | Panel Pixel",
    seoDescription: "Prima occhiata a Distretto Nove, il nuovo fumetto di fantascienza sociale ambientato in una città divisa in nove distretti.",
    seoKeywords: ["distretto nove fumetto", "fumetto distopico", "fantascienza sociale", "anteprima fumetti 2026"],
    content: [
      { type: "paragraph", text: "Le prime tavole diffuse in anteprima raccontano una città divisa in nove distretti concentrici, dove l'accesso alle risorse dipende da un sistema di crediti sociali gestito da un'intelligenza collettiva mai vista in scena." },
      { type: "paragraph", text: "L'autore, al suo debutto su una serie regolare dopo anni di produzioni indipendenti, promette un ritmo di uscita bimestrale e un arco narrativo chiuso in dodici numeri, una scelta rara nel panorama seriale attuale." },
      { type: "paragraph", text: "Se le premesse verranno mantenute, Distretto Nove potrebbe diventare uno dei titoli di fantascienza sociale più rilevanti della stagione: l'uscita del primo numero è attesa per l'inizio del prossimo anno." },
    ],
  },
  {
    slug: "ombre-di-vetro-nuovo-capitolo",
    category: "anteprime",
    type: "notizia",
    title: "Ombre di Vetro: tutto quello che sappiamo sul nuovo capitolo",
    excerpt: "Tutto quello che sappiamo finora sul nuovo capitolo della saga, tra indiscrezioni ufficiali e primi materiali diffusi dallo studio.",
    author: "Gianfranco Barry",
    date: "2026-07-18",
    image: "assets/images/ombre-di-vetro-nuovo-capitolo.svg",
    featured: false,
    seoTitle: "Ombre di Vetro: tutte le novità sul nuovo capitolo | Panel Pixel",
    seoDescription: "Tutto quello che sappiamo finora sul nuovo capitolo di Ombre di Vetro: ambientazione, grafica e possibile data di uscita.",
    seoKeywords: ["ombre di vetro", "anteprima videogioco", "nuovo capitolo saga", "videogiochi in uscita"],
    content: [
      { type: "paragraph", text: "Dopo il cliffhanger del capitolo precedente, lo studio di sviluppo ha confermato che il prossimo episodio della saga sposterà l'ambientazione in una città sospesa sopra un oceano artificiale, abbandonando le atmosfere desertiche a cui i fan erano abituati." },
      { type: "paragraph", text: "Le prime immagini mostrano un comparto grafico rinnovato e un sistema di combattimento che integra elementi di verticalità mai visti nei capitoli precedenti, mentre restano ancora segrete le informazioni sulla durata della campagna principale." },
      { type: "paragraph", text: "La data di uscita non è stata ancora annunciata, ma le fonti vicine allo studio parlano di una finestra di lancio entro la fine del prossimo anno solare." },
    ],
  },
  {
    slug: "autunno-d-autore-uscite-cinema",
    category: "anteprime",
    type: "radar",
    rubricName: "Radar Cinema",
    period: "Autunno 2026",
    title: "Autunno d'autore: le uscite cinema da segnare in agenda",
    excerpt: "Le uscite cinematografiche da segnare in agenda per una stagione che promette un ritorno deciso al cinema di autore.",
    author: "Gianfranco Barry",
    date: "2026-07-12",
    image: "assets/images/autunno-d-autore-uscite-cinema.svg",
    featured: false,
    seoTitle: "Autunno d'autore: le uscite cinema da non perdere | Panel Pixel",
    seoDescription: "Le uscite cinematografiche d'autore da segnare in agenda per l'autunno: i titoli attesi nei festival internazionali.",
    seoKeywords: ["uscite cinema autunno", "cinema d'autore 2026", "film festival internazionali", "anteprime cinema"],
    content: {
      intro: "Dopo un'estate dominata da blockbuster e sequel, il calendario autunnale vira decisamente verso il cinema d'autore. Ecco i quattro titoli da segnare in agenda.",
      items: [
        {
          title: "La Casa sul Confine",
          creator: "Regia di Bianca Moretti (al suo terzo lungometraggio)",
          publisher: "Distribuzione: Nuova Luce Film",
          releaseInfo: "Al cinema dal 15 ottobre 2026, dopo l'anteprima al Festival di Locarno",
          why: "Un dramma corale già accostato dalla critica ai grandi film ensemble degli anni Settanta: la prima vera scommessa d'autore della stagione.",
        },
        {
          title: "Ultima Luce d'Agosto",
          creator: "Regia di Tommaso Reale",
          publisher: "Distribuzione indipendente, uscita in sala selezionata",
          releaseInfo: "Al cinema dal 29 ottobre 2026 in un numero limitato di sale",
          why: "Girato con un budget ridottissimo, è il titolo a basso costo più chiacchierato tra gli addetti ai lavori: libertà formale allo stato puro.",
        },
        {
          title: "Il Peso delle Nuvole",
          creator: "Regia di Sofia Lanza",
          publisher: "Distribuzione: Meridiano Pictures",
          releaseInfo: "Al cinema dal 5 novembre 2026",
          why: "Un road movie ambientato quasi interamente in un'unica notte, che promette di ribaltare le convenzioni del genere.",
        },
        {
          title: "Controcanto",
          creator: "Diretto da un collettivo di quattro autori esordienti",
          publisher: "Distribuzione: circuito festival, uscita in sala a seguire",
          releaseInfo: "Anteprima a novembre 2026, uscita in sala prevista per inizio 2027",
          why: "Un documentario ibrido che mescola found footage e animazione: la scommessa più rischiosa e interessante della stagione.",
        },
      ],
    },
  },
];
