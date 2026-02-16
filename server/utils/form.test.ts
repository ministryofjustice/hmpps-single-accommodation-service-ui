import { injectConditionals } from './form'

describe('form utils', () => {
  describe('injectConditionals', () => {
    it('returns items with conditional HTML for matching values', () => {
      const items = [
        { value: 'FOO', text: 'Foo', checked: false },
        { value: 'BAR', text: 'Bar', checked: false },
        { value: 'OTHER', text: 'Other', checked: false },
      ]

      const conditionals = {
        OTHER: '<input type="text" name="otherDetails" />',
      }

      const result = injectConditionals(items, conditionals)

      expect(result).toEqual([
        { value: 'FOO', text: 'Foo', checked: false, conditional: undefined },
        { value: 'BAR', text: 'Bar', checked: false, conditional: undefined },
        {
          value: 'OTHER',
          text: 'Other',
          checked: false,
          conditional: { html: '<input type="text" name="otherDetails" />' },
        },
      ])
    })

    it('returns items with conditional HTML for multiple matching values', () => {
      const items = [
        { value: 'FOO', text: 'Foo', checked: false },
        { value: 'BAR', text: 'Bar', checked: false },
        { value: 'BAZ', text: 'Baz', checked: false },
      ]

      const conditionals = {
        FOO: '<p>Details for Foo</p>',
        BAZ: '<p>Details for Baz</p>',
      }

      const result = injectConditionals(items, conditionals)

      expect(result).toEqual([
        { value: 'FOO', text: 'Foo', checked: false, conditional: { html: '<p>Details for Foo</p>' } },
        { value: 'BAR', text: 'Bar', checked: false, conditional: undefined },
        { value: 'BAZ', text: 'Baz', checked: false, conditional: { html: '<p>Details for Baz</p>' } },
      ])
    })

    it('returns items without conditionals when the conditionals object is empty', () => {
      const items = [
        { value: 'FOO', text: 'Foo', checked: false },
        { value: 'BAR', text: 'Bar', checked: false },
      ]

      const result = injectConditionals(items, {})

      expect(result).toEqual([
        { value: 'FOO', text: 'Foo', checked: false, conditional: undefined },
        { value: 'BAR', text: 'Bar', checked: false, conditional: undefined },
      ])
    })
  })
})
