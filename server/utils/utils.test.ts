import {
  convertObjectsToSelectOptions,
  convertToTitleCase,
  htmlContent,
  initialiseName,
  summaryListRowOptional,
  summaryListRowText,
  summaryListRowHtml,
  textContent,
  toParagraphs,
} from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('textContent', () => {
  it.each([
    ['null', null, ''],
    ['undefined', undefined, ''],
    ['Empty string', '', ''],
    ['Some content', 'Some content', 'Some content'],
  ])('%s textContent(%s)', (_: string, a: string, expected: string) => {
    expect(textContent(a)).toEqual({ text: expected })
  })
})

describe('htmlContent', () => {
  it.each([
    ['null', null, ''],
    ['undefined', undefined, ''],
    ['Empty string', '', ''],
    ['Some content', '<p>Some content</p>', '<p>Some content</p>'],
  ])('%s htmlContent(%s)', (_: string, a: string, expected: string) => {
    expect(htmlContent(a)).toEqual({ html: expected })
  })
})

describe('toParagraphs', () => {
  it('returns paragraphs from an array of strings', () => {
    expect(toParagraphs(['one', 'two'])).toEqual(`<p>one</p><p>two</p>`)
  })

  it('filters out empty strings and falsy items', () => {
    expect(toParagraphs(['one', '', 'two', null, undefined])).toEqual(`<p>one</p><p>two</p>`)
  })

  it('adds the given class to the paragraphs', () => {
    expect(toParagraphs(['one', 'two'], 'my-class')).toEqual(`<p class="my-class">one</p><p class="my-class">two</p>`)
  })
})

describe('convertObjectsToSelectOptions', () => {
  const objects = [
    {
      id: '123',
      name: 'abc',
    },
    {
      id: '345',
      name: 'def',
    },
  ]

  it('converts objects to an array of select options', () => {
    const result = convertObjectsToSelectOptions(objects, 'Select a keyworker', 'name', 'id')

    expect(result).toEqual([
      {
        value: '',
        text: 'Select a keyworker',
        selected: true,
      },
      {
        text: 'abc',
        value: '123',
        selected: false,
      },
      {
        text: 'def',
        value: '345',
        selected: false,
      },
    ])
  })

  it('marks the object that is the selected value', () => {
    const result = convertObjectsToSelectOptions(objects, 'Select a keyworker', 'name', 'id', '123')

    expect(result).toEqual([
      {
        value: '',
        text: 'Select a keyworker',
        selected: false,
      },
      {
        text: 'abc',
        value: '123',
        selected: true,
      },
      {
        text: 'def',
        value: '345',
        selected: false,
      },
    ])
  })
})

describe('summaryListRowText', () => {
  it('returns a row for a summary list', () => {
    expect(summaryListRowText('Label', 'Value')).toEqual({
      key: { text: 'Label' },
      value: { text: 'Value' },
    })
  })

  it('returns a row for a summary list with actions', () => {
    expect(
      summaryListRowText('Label', 'Value', [
        { text: 'Link 1', href: '#' },
        { text: 'Link 2', href: '/foo', classes: 'foo-bar' },
      ]),
    ).toEqual({
      key: { text: 'Label' },
      value: { text: 'Value' },
      actions: {
        items: [
          { text: 'Link 1', href: '#' },
          { text: 'Link 2', href: '/foo', classes: 'foo-bar' },
        ],
      },
    })
  })
})

describe('summaryListRowHtml', () => {
  it('returns a row for a summary list with HTML content', () => {
    expect(summaryListRowHtml('Label', '<p>Value</p>')).toEqual({
      key: { text: 'Label' },
      value: { html: '<p>Value</p>' },
    })
  })

  it('returns a row for a summary list with HTML content and actions', () => {
    expect(
      summaryListRowHtml('Label', '<p>Value</p>', [
        { text: 'Link 1', href: '#' },
        { text: 'Link 2', href: '/foo', classes: 'foo-bar' },
      ]),
    ).toEqual({
      key: { text: 'Label' },
      value: { html: '<p>Value</p>' },
      actions: {
        items: [
          { text: 'Link 1', href: '#' },
          { text: 'Link 2', href: '/foo', classes: 'foo-bar' },
        ],
      },
    })
  })
})

describe('summaryListRowOptional', () => {
  it('returns a row for summary list when value is present', () => {
    expect(summaryListRowOptional('Reference', 'ABC123', 'No reference added')).toEqual({
      key: { text: 'Reference' },
      value: { text: 'ABC123' },
    })
  })

  it('returns a row for summary list when value is undefined', () => {
    expect(summaryListRowOptional('Reference', undefined, 'No reference added')).toEqual({
      key: { text: 'Reference' },
      value: { html: '<span class="sas-colour--dark-grey">No reference added</span>' },
    })
  })
})
