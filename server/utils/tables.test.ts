import { AccommodationReferralDto as Referral } from '@sas/api'
import { dateCell, linksCell, statusCell, textCell } from './tables'

describe('tables utilities', () => {
  describe('textCell', () => {
    it('returns a text cell with the given text', () => {
      const cell = textCell('CAS TYPE')
      expect(cell).toEqual({ text: 'CAS TYPE' })
    })

    it('returns a text cell with empty string when given empty text', () => {
      const cell = textCell('')
      expect(cell).toEqual({ text: '' })
    })
  })

  describe('statusCell', () => {
    it('returns a status cell with the given status', () => {
      const cell = statusCell('PENDING')
      expect(cell).toEqual({ html: '<strong class="govuk-tag govuk-tag--yellow">Pending</strong>' })
    })

    it('returns a default status cell when given an unknown status', () => {
      const cell = statusCell('UNKNOWN' as Referral['status'])
      expect(cell).toEqual({ html: '<strong class="govuk-tag govuk-tag--grey">Unknown</strong>' })
    })
  })

  describe('dateCell', () => {
    it('returns a date cell with the formatted date', () => {
      const cell = dateCell('2024-06-06')
      expect(cell).toEqual({ text: '6 June 2024' })
    })

    it('returns a date cell with empty string when given an invalid date', () => {
      const cell = dateCell('invalid-date')
      expect(cell).toEqual({ text: 'Invalid Date' })
    })
  })

  describe('linksCell', () => {
    it('returns a formatted links cell', () => {
      const links = [
        { text: 'View', href: '/view' },
        { text: 'Notes', href: '/notes' },
      ]
      expect(linksCell(links)).toMatchSnapshot()
    })
  })
})
