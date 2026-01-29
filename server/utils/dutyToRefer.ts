import { DutyToReferDto } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { StatusCard } from '@sas/ui'
import { dutyToReferStatusColours, formatDateAndDaysAgo, formatDutyToReferStatus } from './format'

export const dutyToReferStatusCard = (dutyToRefer: DutyToReferDto): StatusCard => ({
  heading: 'Duty to Refer (DTR)',
  inactive: dutyToRefer.status === 'NOT_ELIGIBLE',
  status: {
    text: formatDutyToReferStatus(dutyToRefer.status),
    colour: dutyToReferStatusColours[dutyToRefer.status] || 'grey',
  },
  details: detailsForStatus(dutyToRefer),
  links: linksForStatus(dutyToRefer.status),
})

export const linksForStatus = (serviceStatus?: string) => {
  switch (serviceStatus) {
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
      return [{ text: 'Notes', href: '#' }]
    case 'NOT_STARTED':
      return [
        { text: 'Add submission details', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    case 'SUBMITTED':
      return [
        { text: 'Add outcome', href: '#' },
        { text: 'Notes', href: '#' },
      ]
    default:
      return []
  }
}

const summaryListRow = (label: string, value: string): SummaryListRow => ({
  key: { text: label },
  value: { text: value ?? '' },
})

export const detailsForStatus = (dutyToRefer: DutyToReferDto): SummaryListRow[] => {
  const { status } = dutyToRefer
  switch (status) {
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
      return []
    case 'NOT_STARTED':
      return [summaryListRow('Local authority (likely)', dutyToRefer?.submittedTo)]
    case 'SUBMITTED':
      return [
        summaryListRow('Submitted to', dutyToRefer?.submittedTo),
        summaryListRow('Reference', dutyToRefer?.reference),
        summaryListRow('Submitted', formatDateAndDaysAgo(dutyToRefer?.submitted)),
      ]
    default:
      return []
  }
}
