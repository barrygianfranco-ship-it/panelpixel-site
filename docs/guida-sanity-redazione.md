# Guida Sanity per la redazione di Panel Pixel

Questa guida spiega il flusso normale per scrivere e consegnare un articolo. Per problemi o dubbi sui campi, contattare Gianfranco prima di pubblicare o modificare contenuti già approvati.

> **Ambiente:** lo Studio locale presente nel repository usa ancora il dataset di prova `staging`. Per gli articoli destinati al sito usare soltanto il link dello Studio redazionale `production` comunicato da Gianfranco.

## Ruoli e stati

| Stato | Chi lo usa | Significato |
|---|---|---|
| **Bozza** | Collaboratore | L'articolo è in lavorazione e può essere modificato liberamente. |
| **In revisione** | Collaboratore | Il testo e le immagini sono pronti per il controllo del caporedattore. |
| **Approvato** | Gianfranco | L'articolo ha superato la revisione ed è pronto per la pubblicazione. |

Il campo **Stato editoriale** non pubblica da solo l'articolo. Per comparire sul sito servono entrambe queste condizioni:

1. lo stato deve essere **Approvato**;
2. Gianfranco deve usare l'azione **Pubblica** di Sanity.

Il ruolo Contributor può creare e modificare bozze, ma non pubblicarle. Non chiedere credenziali o token ad altri membri della redazione.

## Creare un articolo

1. Aprire lo Studio redazionale indicato da Gianfranco.
2. Entrare in **Tutti gli articoli** o **Bozze**.
3. Selezionare **Crea** e poi **Articolo**.
4. Lasciare **Stato editoriale → Bozza** mentre si lavora.
5. Compilare i campi editoriali e il corpo dell'articolo.

Sanity salva automaticamente. Prima di chiudere la pagina controllare che non siano visibili errori di validazione.

## Campi editoriali

I campi obbligatori sono:

- **Titolo:** il titolo completo che comparirà sul sito.
- **Slug:** generarlo dal titolo e controllare che sia breve, leggibile e senza date provvisorie. Non cambiarlo dopo la pubblicazione senza avvisare Gianfranco.
- **Categoria:** usare lo slug della sezione concordata, per esempio `videogiochi`, `cinema`, `fumetti`, `manga` o `anime`.
- **Tipo:** usare il tipo editoriale concordato, per esempio `recensione`, `approfondimento`, `intervista` o `anteprima`.
- **Sommario:** breve introduzione dell'articolo, utile anche nelle card del sito.
- **Autore:** scrivere il nome esattamente come compare sul sito e negli articoli precedenti.
- **Data:** data prevista o effettiva di pubblicazione.
- **Immagine di copertina:** deve includere tutti i metadati descritti nella sezione successiva.
- **Stato editoriale:** `Bozza` durante la scrittura, `In revisione` quando il pezzo è pronto.
- **Impaginazione:** normalmente `Standard`. Usare `Tavola` o `Survival` solo per articoli concordati con Gianfranco.

Il campo **In evidenza** va attivato soltanto su indicazione del caporedattore.

### Campi consigliati

- **Corpo:** testo completo dell'articolo.
- **Titolo SEO:** titolo sintetico per motori di ricerca e condivisioni.
- **Descrizione SEO:** riassunto chiaro e autonomo, indicativamente entro 150–160 caratteri.
- **Parole chiave SEO:** poche espressioni pertinenti, senza ripetizioni forzate.
- **Provato su:** per recensioni e prove, indicare piattaforma e informazioni utili concordate.

I campi **Tema**, **Titolo testata speciale**, **Sottotitolo testata speciale** e **Motivo grafico** servono soprattutto per le impaginazioni speciali.

## Immagini: campi obbligatori

Ogni nuova immagine, sia di copertina sia nel corpo, deve avere:

- **Testo alternativo:** descrizione breve di ciò che è visibile e utile a comprendere l'articolo. Evitare formule come “immagine di” e non usare la didascalia come riempitivo.
- **Copyright:** titolare dei diritti, per esempio `© Nome editore` o `© Nome fotografo`.
- **Fonte:** provenienza del file, per esempio `Kit stampa dell'editore`, `Screenshot acquisito dalla redazione` o `Foto di Nome Cognome`.

La **Didascalia** è facoltativa e viene mostrata al lettore quando prevista dal blocco. Non sostituisce il testo alternativo.

Per le immagini nel corpo è disponibile anche l'**Allineamento**:

- **Centro:** immagine normale a piena colonna;
- **Sinistra** o **Destra:** immagine laterale, da controllare sempre in anteprima anche su schermo piccolo.

Le immagini importate da Storyblok possono mostrare l'avviso **Metadati da completare**. Prima di mandare l'articolo in revisione:

1. compilare testo alternativo, copyright e fonte;
2. disattivare **Metadati da completare**;
3. verificare che l'avviso sia scomparso.

Non caricare immagini prese da Internet senza una fonte e un diritto d'uso verificabili.

## Scrivere il corpo

Nel corpo sono disponibili paragrafi, titoli H2 e H3, citazioni, elenchi, link, grassetto, corsivo, codice ed evidenziato.

Sono inoltre disponibili blocchi editoriali come:

- immagine e galleria;
- box editoriale e citazione in evidenza;
- tre colonne;
- embed YouTube o X;
- note;
- conclusione editoriale;
- scheda dell'opera.

I blocchi **Survival** — capitolo, cronologia, confronto, panorama e nota d'archivio — sono riservati ai dossier con impaginazione Survival. Prima di usarli concordare la struttura con Gianfranco e controllare l'anteprima completa.

Per i link esterni attivare **Apri in una nuova scheda** quando è utile lasciare aperto l'articolo. Non inserire nel testo token, password, link personali di riscatto o informazioni private.

## Mandare l'articolo in revisione

Prima di cambiare stato, verificare:

- titolo, slug, categoria, tipo, autore e data;
- sommario e corpo completi;
- copertina presente;
- testo alternativo, copyright e fonte per tutte le immagini;
- nessun avviso **Metadati da completare**;
- titoli H2/H3 ordinati correttamente;
- link ed embed funzionanti;
- anteprima controllata su desktop e mobile, soprattutto per immagini laterali e layout speciali;
- campi SEO compilati quando disponibili.

Quando il pezzo è pronto:

1. impostare **Stato editoriale → In revisione**;
2. attendere il salvataggio automatico;
3. comunicare a Gianfranco titolo e slug nel canale redazionale concordato;
4. non continuare a modificare il pezzo durante la revisione senza avvisarlo.

Gianfranco effettua la revisione, riporta eventualmente il documento a **Bozza** oppure lo imposta su **Approvato** e lo pubblica.

## Correzioni dopo la pubblicazione

Per correggere un articolo già online, avvisare prima Gianfranco indicando titolo, slug e modifica necessaria. Il sito legge soltanto documenti pubblicati e con stato **Approvato**: salvare una modifica nello Studio non significa necessariamente renderla subito pubblica.

Storyblok resta disponibile temporaneamente come archivio di sicurezza, ma i nuovi articoli vanno creati soltanto in Sanity.
