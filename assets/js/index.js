import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import makeAutocomplete from './accessibleAutocomplete'

govukFrontend.initAll()
mojFrontend.initAll()

document.querySelectorAll('[data-autocomplete]').forEach(makeAutocomplete)
