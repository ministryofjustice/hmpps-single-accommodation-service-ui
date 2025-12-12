import { CasReferralStatus } from '@sas/api'
import { convertToTitleCase, htmlContent, initialiseName, statusTag, textContent } from './utils'

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

describe('statusTag', () => {
  it('returns the correct tag for given status', () => {
    expect(statusTag('PENDING')).toEqual('<strong class="govuk-tag govuk-tag--yellow">Pending</strong>')
  })

  it('returns the default tag for unknown status', () => {
    expect(statusTag('OTHER' as CasReferralStatus)).toEqual('<strong class="govuk-tag govuk-tag--grey">Other</strong>')
  })
})
