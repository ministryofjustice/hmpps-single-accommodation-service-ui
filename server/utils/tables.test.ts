import { dateCell, linksCell } from './tables'

describe('tables utilities', () => {
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

  describe('linksCell macro', () => {
    it('renders a formatted links cell', () => {
      const links = [
        { text: 'View', href: '/view' },
        { text: 'Notes', href: '/notes' },
      ]
      expect(linksCell(links)).toMatchSnapshot()
    })

    it('renders nothing when there are no links', () => {
      expect(linksCell([])).toMatchSnapshot()
    })
  })
})
