import { StatusCard, StatusCell, StatusTag } from '@sas/ui'
import { CaseDto as Case } from '@sas/api'
import { riskLevelTag, statusCard, statusCell, statusTag } from './macros'

describe('Macros', () => {
  describe('Status Tag', () => {
    it('renders a status tag with given colour', () => {
      const tag: StatusTag = {
        text: 'Foo',
        colour: 'red',
      }

      expect(statusTag(tag)).toMatchSnapshot()
    })

    it('renders a status tag with the default colour', () => {
      const tag: StatusTag = {
        text: 'Baz',
      }

      expect(statusTag(tag)).toMatchSnapshot()
    })

    it('renders a status tag with noWrap class when noWrap is true', () => {
      const tag: StatusTag = {
        text: 'Qux',
        colour: 'blue',
      }

      expect(statusTag(tag, true)).toMatchSnapshot()
    })
  })

  describe('Status Cell', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-12-10'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('renders a status cell with a date', () => {
      const cell: StatusCell = {
        status: { text: 'Foo', colour: 'red' },
        date: '2026-06-01',
      }

      expect(statusCell(cell)).toMatchSnapshot()
    })

    it('renders a status cell without a date', () => {
      const cell: StatusCell = {
        status: { text: 'John' },
      }

      expect(statusCell(cell)).toMatchSnapshot()
    })
  })

  describe('riskLevelTag', () => {
    it.each(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'])(
      'renders a risk level tag for risk level %s',
      (level: Case['riskLevel']) => {
        expect(riskLevelTag(level)).toMatchSnapshot()
      },
    )

    it('renders an unknown risk level tag', () => {
      expect(riskLevelTag(undefined)).toMatchSnapshot()
    })
  })

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
