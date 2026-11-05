import {defineField, defineType} from 'sanity'

// Caroselli pensati solo per Instagram, mostrati nella home del sito:
// ai lati su schermi larghi, in una fascia «Dal nostro Instagram» sugli altri.
export const caroselloInstagram = defineType({
  name: 'caroselloInstagram', title: 'Carosello Instagram', type: 'document',
  fields: [
    defineField({name: 'titolo', title: 'Titolo', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slide', title: 'Slide', type: 'array', of: [{type: 'image'}],
      description: 'Nell’ordine del post, dalla copertina all’ultima. Formato 4:5 (1080×1350 o multipli).',
      options: {layout: 'grid'}, validation: (r) => r.required().min(1),
    }),
    defineField({name: 'link', title: 'Link al post', type: 'url', description: 'Facoltativo. Vuoto = porta al profilo @panelpixel.it.', validation: (r) => r.uri({scheme: ['https']})}),
    defineField({
      name: 'posizione', title: 'Posizione', type: 'string', initialValue: 'sinistra',
      options: {list: [{title: 'Sinistra', value: 'sinistra'}, {title: 'Destra', value: 'destra'}], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'attivo', title: 'Mostra sul sito', type: 'boolean', initialValue: true, description: 'Il sito mostra il più recente attivo per ogni posizione.'}),
  ],
  preview: {
    select: {title: 'titolo', posizione: 'posizione', attivo: 'attivo', media: 'slide.0'},
    prepare: ({title, posizione, attivo, media}) => ({title, subtitle: `${posizione === 'destra' ? 'Destra' : 'Sinistra'}${attivo === false ? ' · nascosto' : ''}`, media}),
  },
})
