import type {StructureBuilder, StructureResolver} from 'sanity/structure'

const byStatus = (S: StructureBuilder, title: string, value: string) =>
  S.listItem().title(title).child(
    S.documentList().title(title).filter('_type == "articolo" && stato == $stato').params({stato: value}),
  )

export const structure: StructureResolver = (S) => S.list().title('Panel Pixel').items([
  S.listItem().title('Tutti gli articoli').child(S.documentTypeList('articolo').title('Tutti gli articoli')),
  S.divider(), byStatus(S, 'Bozze', 'bozza'), byStatus(S, 'In revisione', 'in_revisione'), byStatus(S, 'Approvati', 'approvato'),
])
