# Panel Pixel — Sanity Studio

Studio editoriale separato dal sito statico HTML/JavaScript. Non usa Next.js.

- Progetto Sanity: `np9ttr0b`
- Dataset predefinito: `staging` (privato)
- Avvio locale: `npm run dev`
- Verifica compilazione: `npm run build`

## Flusso editoriale e ruoli

Il campo `stato` segue `bozza` → `in_revisione` → `approvato`. Non sostituisce i permessi Sanity: nel pannello del progetto Gianfranco deve restare Administrator e i collaboratori che scrivono devono ricevere il ruolo Contributor, privo del permesso di pubblicazione. Viewer resta adatto a chi deve soltanto leggere.

Lo Studio locale punta intenzionalmente a `staging` e mostra il titolo **Panel Pixel — Prove (staging)**. Lo Studio redazionale pubblicato su <https://panelpixel.sanity.studio/> usa invece `production` e mostra **Panel Pixel — Redazione**.

La separazione è controllata da `.env.development` (`staging`) e `.env.production` (`production`), che contengono soltanto nomi pubblici dei dataset. Il deploy redazionale ripetibile si esegue esclusivamente dopo l'approvazione del caporedattore:

```powershell
npm run deploy:production
```

## Immagini importate

Per i nuovi contenuti `alt`, `copyright` e `fonte` sono obbligatori. Lo script della fase 3 potrà impostare `importata_da_storyblok: true` e `da_completare: true` sulle sole immagini storiche con metadati mancanti; lo Studio le segnalerà con un avviso finché non saranno completate.

## Provare il sito con Sanity

Dalla cartella `sanity-studio` eseguire:

```powershell
npx sanity exec scripts/start-site-preview.mjs --with-user-token
```

Il comando avvia Netlify Dev usando la credenziale della CLI soltanto nella memoria del processo. Per vedere una bozza, aprire **Anteprima sito** nello Studio locale: il Presentation Tool crea un’autorizzazione temporanea sul dataset `staging`, che Netlify convalida lato server. Nessun token o segreto viene inserito nell’URL o nel codice pubblico. Sanity è la sorgente predefinita; `?cms=storyblok` seleziona Storyblok come paracadute nella sessione corrente e `?cms=sanity` torna a Sanity.

In locale (o con `sanity-dataset=staging`) il sito legge il dataset privato `staging` tramite la funzione autenticata. Sul dominio pubblico i contenuti approvati vengono letti direttamente dalla CDN pubblica del dataset `production`, con prospettiva `published` e senza token. L'anteprima delle bozze continua sempre a passare dalla funzione server.

In un ambiente Netlify reale le sole anteprime richiedono le variabili server-side `SANITY_READ_TOKEN` e `SANITY_PREVIEW_SECRET`. Non devono essere inserite nel repository o nel JavaScript pubblico. Prima del passaggio va inoltre autorizzata l'origine del sito nelle impostazioni CORS del progetto Sanity.

## Verifiche della Fase 5

Il confronto ripetibile tra il backup Storyblok e `staging` si avvia da questa cartella:

```powershell
npx sanity exec scripts/compare-html-staging.mjs --with-user-token
```

Con il server locale già avviato, dalla radice del repository:

```powershell
node tests/sanity-phase5-live.test.js http://localhost:8888
```

I report dettagliati vengono scritti nel backup locale ignorato da Git.

## Fase 6 — production e anteprima Netlify

L'importazione di `production` usa un runner separato con un blocco di sicurezza esplicito:

```powershell
npx sanity exec scripts/migrate-production.mjs --with-user-token
npx sanity exec scripts/verify-production.mjs --with-user-token
```

La fixture `test-survival-preview` resta soltanto in `staging` e non viene importata in `production`. Lo script continua a essere idempotente: lo stesso slug produce lo stesso ID documento.

Per l'anteprima sicura delle bozze, configurare in Netlify queste variabili soltanto lato server:

- `SANITY_READ_TOKEN`: token Sanity con permesso Viewer sul progetto, necessario alla funzione che legge il dataset privato `staging`; non inserirlo nel repository né nel JavaScript pubblico.
- `SANITY_PREVIEW_SECRET`: valore casuale lungo e non riutilizzato, condiviso soltanto tra il link di anteprima e la funzione Netlify; non inserirlo nel repository.

I contenuti pubblicati di `production` non richiedono variabili: il browser usa direttamente la API CDN Sanity con prospettiva `published`. L'origine esatta del deploy Netlify e quelle del sito pubblico devono essere autorizzate in CORS senza credenziali.
