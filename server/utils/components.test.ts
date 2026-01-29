import { StatusCard } from '@sas/ui'

import { statusCard } from './components'

describe('Components', () => {
  describe('Status Card', () => {
    it('renders a basic status card', () => {
      const card: StatusCard = {
        heading: 'Foo',
      }

      expect(statusCard(card)).toMatchSnapshot()
    })

    it('renders an inactive status card', () => {
      const card: StatusCard = {
        heading: 'Foo',
        inactive: true,
      }

      expect(statusCard(card)).toMatchSnapshot()
    })

    it('renders a status card with full information', () => {
      const card: StatusCard = {
        heading: 'Foo',
        status: {
          text: 'Bar',
          colour: 'red',
        },
        details: [{ key: { text: 'Baz' }, value: { text: 'Qux' } }],
        links: [{ text: 'Quux', href: '#' }],
      }

      expect(statusCard(card)).toMatchSnapshot()
    })
  })
})
