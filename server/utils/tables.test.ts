import { dateCell, linksCell, htmlCell, textCell } from './tables'

describe('tables utilities', () => {
  describe('textCell', () => {
    it('returns a cell with the given text', () => {
      const cell = textCell('Some text')
      expect(cell).toEqual({ text: 'Some text' })
    })

    it('returns a text cell with empty string when given empty text', () => {
      const cell = textCell('')
      expect(cell).toEqual({ text: '' })
    })
  })

  describe('htmlCell', () => {
    it('returns a cell with the given html', () => {
      const cell = htmlCell('<p>Some HTML</p>')
      expect(cell).toEqual({ html: '<p>Some HTML</p>' })
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

    it('returns nothing when there are no links', () => {
      expect(linksCell([])).toMatchSnapshot()
    })
  })
})
