import {articolo} from './articolo'
import {caroselloInstagram} from './caroselloInstagram'
import * as types from './objects'

export const schemaTypes = [articolo, caroselloInstagram, ...Object.values(types)]
