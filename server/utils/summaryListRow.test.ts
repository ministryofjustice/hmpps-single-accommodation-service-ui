import { summaryListRow } from './summaryListRow'

describe('summaryListRow', () => {
  it('returns a row for a text value', () => {
    expect(summaryListRow('Text', 'Content')).toEqual({
      key: { text: 'Text' },
      value: { text: 'Content' },
    })
  })

  it('returns a row for an html value', () => {
    expect(summaryListRow('HTML', '<p>Content</p>', { type: 'html' })).toEqual({
      key: { text: 'HTML' },
      value: { html: '<p>Content</p>' },
    })
  })

  it('returns a row for a text block value', () => {
    expect(summaryListRow('Text block', 'some\nlines\nof text', { type: 'textBlock' })).toEqual({
      key: { text: 'Text block' },
      value: { html: `<div class="sas-text-block">some\nlines\nof text</div>` },
    })
  })

  it('returns a row with empty value', () => {
    expect(summaryListRow('Empty value', '')).toEqual({
      key: { text: 'Empty value' },
      value: { text: '' },
    })
  })

  it('returns a row with a default for no value', () => {
    expect(summaryListRow('No value', undefined, { noValue: 'N/A' })).toEqual({
      key: { text: 'No value' },
      value: { html: `<span class="sas-colour--dark-grey">N/A</span>` },
    })
  })

  it('returns a row with actions', () => {
    expect(summaryListRow('Actions', 'Please', { actions: [{ text: 'Link', href: '#' }] })).toEqual({
      key: { text: 'Actions' },
      value: { text: 'Please' },
      actions: { items: [{ text: 'Link', href: '#' }] },
    })
  })

  it('returns a row with a value and all options set', () => {
    expect(
      summaryListRow('A', 'Yes', { actions: [{ text: 'Link', href: '#' }], noValue: 'No', type: 'textBlock' }),
    ).toEqual({
      key: { text: 'A' },
      value: { html: `<div class="sas-text-block">Yes</div>` },
      actions: { items: [{ text: 'Link', href: '#' }] },
    })
  })

  it('returns a row with no value and all options set', () => {
    expect(
      summaryListRow('B', '', { actions: [{ text: 'Link', href: '#' }], noValue: 'No', type: 'textBlock' }),
    ).toEqual({
      key: { text: 'B' },
      value: { html: `<span class="sas-colour--dark-grey">No</span>` },
      actions: { items: [{ text: 'Link', href: '#' }] },
    })
  })
})
