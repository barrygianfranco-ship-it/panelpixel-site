import {defineArrayMember, defineField, defineType} from 'sanity'

type ImportedImage = {importata_da_storyblok?: boolean; da_completare?: boolean}
const field = (name: string, title: string, type = 'string') => defineField({name, title, type})
const required = (name: string, title: string, type = 'string') =>
  defineField({name, title, type, validation: (rule) => rule.required()})
const imageMetadata = (name: 'alt' | 'copyright' | 'fonte', title: string) => defineField({
  name, title, type: 'string',
  validation: (rule) => rule.custom((value, context) => {
    if (typeof value === 'string' && value.trim()) return true
    const image = context.parent as ImportedImage | undefined
    return image?.importata_da_storyblok && image.da_completare ? true : `${title} è obbligatorio per i nuovi contenuti`
  }),
})

export const immagineEditoriale = defineType({
  name: 'immagineEditoriale', title: 'Immagine editoriale', type: 'image', options: {hotspot: true},
  fields: [
    imageMetadata('alt', 'Testo alternativo'), field('didascalia', 'Titolo / didascalia'),
    imageMetadata('copyright', 'Copyright'), imageMetadata('fonte', 'Fonte'),
    defineField({
      name: 'allineamento', title: 'Allineamento nel corpo', type: 'string', initialValue: 'center',
      options: {list: [{title: 'Centro', value: 'center'}, {title: 'Sinistra', value: 'left'}, {title: 'Destra', value: 'right'}], layout: 'radio'},
    }),
    defineField({
      name: 'da_completare', title: 'Metadati da completare', type: 'boolean', initialValue: false,
      description: 'Eccezione riservata alle immagini importate. Disattivare dopo aver completato i metadati.',
      hidden: ({parent}) => !(parent as ImportedImage | undefined)?.importata_da_storyblok,
    }),
    defineField({name: 'importata_da_storyblok', title: 'Importata da Storyblok', type: 'boolean', readOnly: true, hidden: true}),
  ],
  validation: (rule) => [
    rule.required().assetRequired(),
    rule.custom((value) => (value as ImportedImage | undefined)?.da_completare ? 'Immagine importata: completare alt, copyright e fonte' : true).warning(),
  ],
  preview: {
    select: {media: 'asset', alt: 'alt', incomplete: 'da_completare'},
    prepare: ({media, alt, incomplete}) => ({media, title: alt || 'Immagine senza alt', subtitle: incomplete ? '⚠ Metadati da completare' : 'Metadati completi'}),
  },
})

export const temaArticolo = defineType({
  name: 'temaArticolo', title: 'Tema articolo', type: 'object',
  fields: [field('background', 'Sfondo'), field('accent', 'Colore principale'), field('accento_2', 'Secondo colore'), field('accento_3', 'Terzo colore'), defineField({name: 'testo_chiaro', title: 'Testo chiaro', type: 'boolean', initialValue: false})],
})

export const box = defineType({name: 'box', title: 'Box editoriale', type: 'object', fields: [required('content', 'Contenuto', 'text'), field('color', 'Colore')]})
export const gallery = defineType({name: 'gallery', title: 'Galleria', type: 'object', fields: [defineField({name: 'images', title: 'Immagini', type: 'array', of: [{type: 'immagineEditoriale'}], validation: (r) => r.required().min(1)})]})
export const columns3 = defineType({
  name: 'columns3', title: 'Tre colonne', type: 'object', fields: [
    field('left_text', 'Testo sinistro', 'text'), field('left_border', 'Bordo sinistro', 'boolean'),
    required('image', 'Immagine centrale', 'immagineEditoriale'), field('image_border', 'Bordo immagine', 'boolean'),
    field('right_text', 'Testo destro', 'text'), field('right_border', 'Bordo destro', 'boolean'),
  ],
})
export const embed = defineType({
  name: 'embed', title: 'Embed', type: 'object', fields: [
    defineField({name: 'type', title: 'Tipo', type: 'string', options: {list: [{title: 'YouTube', value: 'youtube'}, {title: 'Tweet / X', value: 'tweet'}], layout: 'radio'}, validation: (r) => r.required()}),
    required('url', 'URL', 'url'),
  ],
})
export const footnoteItem = defineType({name: 'footnoteItem', title: 'Nota', type: 'object', fields: [defineField({name: 'numero', title: 'Numero', type: 'number', validation: (r) => r.required().integer().positive()}), required('text', 'Testo', 'text')]})
export const footnotes = defineType({name: 'footnotes', title: 'Note', type: 'object', fields: [defineField({name: 'note', title: 'Note', type: 'array', of: [{type: 'footnoteItem'}], validation: (r) => r.required().min(1)})]})
export const pullquote = defineType({name: 'pullquote', title: 'Citazione in evidenza', type: 'object', fields: [required('text', 'Testo', 'text'), field('source', 'Fonte')]})
export const takeaway = defineType({name: 'takeaway', title: 'Conclusione editoriale', type: 'object', fields: [field('title', 'Titolo'), required('text', 'Testo', 'text'), field('note_label', 'Etichetta nota'), field('note', 'Nota', 'text')]})

const workFields = [1, 2, 3, 4].flatMap((n) => [field(`item_${n}_label`, `Voce ${n} — etichetta`), field(`item_${n}_value`, `Voce ${n} — valore`)])
export const workCard = defineType({name: 'work_card', title: 'Scheda opera', type: 'object', fields: [required('title', 'Titolo'), ...workFields]})

export const survivalChapter = defineType({
  name: 'survival_chapter', title: 'Survival — apertura capitolo', type: 'object',
  fields: [required('number', 'Numero'), field('eyebrow', 'Occhiello'), required('title', 'Titolo'), field('years', 'Anni'), field('summary', 'Sommario', 'text')],
})
export const survivalTimelineItem = defineType({name: 'survival_timeline_item', title: 'Evento cronologico', type: 'object', fields: [required('year', 'Anno'), required('title', 'Titolo'), field('text', 'Testo', 'text')]})
export const survivalTimeline = defineType({name: 'survival_timeline', title: 'Survival — cronologia', type: 'object', fields: [field('title', 'Titolo'), defineField({name: 'items', title: 'Eventi', type: 'array', of: [{type: 'survival_timeline_item'}], validation: (r) => r.required().min(1)})]})
export const survivalCompare = defineType({
  name: 'survival_compare', title: 'Survival — confronto', type: 'object', fields: [
    field('title', 'Titolo'), field('left_image', 'Immagine sinistra', 'immagineEditoriale'), field('left_title', 'Titolo sinistro'), field('left_text', 'Testo sinistro', 'text'),
    field('right_image', 'Immagine destra', 'immagineEditoriale'), field('right_title', 'Titolo destro'), field('right_text', 'Testo destro', 'text'),
  ],
})
export const survivalPanorama = defineType({name: 'survival_panorama', title: 'Survival — panorama', type: 'object', fields: [required('image', 'Immagine', 'immagineEditoriale'), field('caption', 'Didascalia')]})
export const survivalDossier = defineType({name: 'survival_dossier', title: 'Survival — nota d’archivio', type: 'object', fields: [field('label', 'Etichetta'), field('code', 'Codice'), field('title', 'Titolo'), field('text', 'Testo', 'text')]})

const bodyObjects = ['immagineEditoriale', 'box', 'gallery', 'columns3', 'embed', 'footnotes', 'pullquote', 'takeaway', 'work_card', 'survival_chapter', 'survival_compare', 'survival_dossier', 'survival_panorama', 'survival_timeline']
export const corpoArticolo = defineType({
  name: 'corpoArticolo', title: 'Corpo articolo', type: 'array', of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normale', value: 'normal'}, {title: 'Titolo H2', value: 'h2'}, {title: 'Titolo H3', value: 'h3'}, {title: 'Citazione', value: 'blockquote'}],
      lists: [{title: 'Elenco puntato', value: 'bullet'}, {title: 'Elenco numerato', value: 'number'}],
      marks: {
        decorators: [{title: 'Grassetto', value: 'strong'}, {title: 'Corsivo', value: 'em'}, {title: 'Codice', value: 'code'}, {title: 'Evidenziato', value: 'highlight'}],
        annotations: [{name: 'link', type: 'object', title: 'Link', fields: [
          defineField({name: 'href', title: 'URL', type: 'url', validation: (r) => r.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto']})}),
          defineField({name: 'blank', title: 'Apri in una nuova scheda', type: 'boolean', initialValue: false}),
        ]}],
      },
    }),
    ...bodyObjects.map((type) => defineArrayMember({type})),
  ],
})
