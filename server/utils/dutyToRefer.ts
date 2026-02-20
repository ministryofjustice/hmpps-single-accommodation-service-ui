import { DutyToReferDto } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { StatusCard, StatusTag } from '@sas/ui'
import { formatDateAndDaysAgo } from './dates'

const dutyToReferStatusTag = (status: DutyToReferDto['status']): StatusTag =>
  ({
    NOT_ELIGIBLE: { text: 'Not eligible' },
    UPCOMING: { text: 'Upcoming', colour: 'yellow' },
    NOT_STARTED: { text: 'Not started', colour: 'red' },
    SUBMITTED: { text: 'Submitted', colour: 'green' },
  })[status] || { text: 'Unknown' }

export const dutyToReferStatusCard = (dutyToRefer: DutyToReferDto): StatusCard => {
  const status = dutyToRefer?.status
  return {
    heading: 'Duty to Refer (DTR)',
    inactive: status === 'NOT_ELIGIBLE',
    status: dutyToReferStatusTag(status),
    details: detailsForStatus(dutyToRefer),
    links: linksForStatus(status),
  }
}

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
  const { status } = dutyToRefer ?? {}
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
