import {enableVisualEditing} from '@sanity/visual-editing/enable-visual-editing'

if (window.self !== window.top) {
  window.__disableSanityVisualEditing = enableVisualEditing()
}
