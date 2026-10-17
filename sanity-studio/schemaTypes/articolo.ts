import {defineField, defineType} from 'sanity'

const required = (name: string, title: string, type = 'string', group = 'editoriale') => defineField({name, title, type, group, validation: (r) => r.required()})

export const articolo = defineType({
  name: 'articolo', title: 'Articolo', type: 'document',
  groups: [{name: 'editoriale', title: 'Editoriale', default: true}, {name: 'corpo', title: 'Corpo'}, {name: 'aspetto', title: 'Aspetto'}, {name: 'seo', title: 'SEO'}],
  fields: [
    required('title', 'Titolo'),
    defineField({name: 'slug', title: 'Slug', type: 'slug', group: 'editoriale', options: {source: 'title', maxLength: 96}, validation: (r) => r.required()}),
    required('category', 'Categoria'), required('type', 'Tipo'), required('excerpt', 'Sommario', 'text'),
    defineField({name: 'author', title: 'Autore', description: 'Gli autori restano definiti in js/authors.js.', type: 'string', group: 'editoriale', validation: (r) => r.required()}),
    required('date', 'Data', 'date'), required('image', 'Immagine di copertina', 'immagineEditoriale'),
    defineField({name: 'featured', title: 'In evidenza', type: 'boolean', initialValue: false, group: 'editoriale'}),
    defineField({
      name: 'stato', title: 'Stato editoriale', type: 'string', group: 'editoriale', initialValue: 'bozza',
      description: 'Non pubblica il documento: la pubblicazione dipende dai permessi del ruolo Sanity.',
      options: {list: [{title: 'Bozza', value: 'bozza'}, {title: 'In revisione', value: 'in_revisione'}, {title: 'Approvato', value: 'approvato'}], layout: 'radio'}, validation: (r) => r.required(),
    }),
    defineField({name: 'corpo', title: 'Corpo', type: 'corpoArticolo', group: 'corpo'}),
    defineField({name: 'tema', title: 'Tema', type: 'temaArticolo', group: 'aspetto'}),
    defineField({name: 'impaginazione', title: 'Impaginazione', type: 'string', group: 'aspetto', initialValue: 'standard', options: {list: [{title: 'Standard', value: 'standard'}, {title: 'Tavola — fumetti', value: 'tavola'}, {title: 'Survival — dossier horror', value: 'survival'}], layout: 'radio'}, validation: (r) => r.required()}),
    defineField({name: 'testata_titolo', title: 'Titolo testata speciale', type: 'string', group: 'aspetto'}),
    defineField({name: 'testata_sottotitolo', title: 'Sottotitolo testata speciale', type: 'string', group: 'aspetto'}),
    defineField({name: 'motivo', title: 'Motivo grafico', type: 'string', group: 'aspetto'}),
    defineField({name: 'tried_on', title: 'Provato su', type: 'string', group: 'aspetto'}),
    defineField({name: 'seo_title', title: 'Titolo SEO', type: 'string', group: 'seo'}),
    defineField({name: 'seo_description', title: 'Descrizione SEO', type: 'text', group: 'seo'}),
    defineField({name: 'seo_keywords', title: 'Parole chiave SEO', type: 'array', of: [{type: 'string'}], group: 'seo', options: {layout: 'tags'}}),
  ],
  orderings: [{title: 'Data, più recenti', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', media: 'image', author: 'author', stato: 'stato'},
    prepare: ({title, media, author, stato}) => {
      const stati: Record<string, string> = {bozza: 'Bozza', in_revisione: 'In revisione', approvato: 'Approvato'}
      return {title, media, subtitle: `${stati[stato] || 'Senza stato'} · ${author || 'Senza autore'}`}
    },
  },
})
