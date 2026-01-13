import { DutyToReferDto } from '@sas/api'
import { SummaryListRow } from '@govuk/ui'
import { dutyToReferStatusTag, formatDate } from './format'
import { nunjucksInline } from './nunjucksSetup'

export const dutyToReferToCard = (dutyToRefer: DutyToReferDto): string => {
  return nunjucksInline().render('components/dutyToReferCard.njk', {
    status: dutyToRefer.status,
    statusTag: dutyToReferStatusTag(dutyToRefer.status),
    links: linksForStatus(dutyToRefer.status),
    actions: actionsForStatus(dutyToRefer),
  })
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
  key: { text: label, classes: 'sas-card-summary-list__key' },
  value: { text: value ?? '', classes: 'sas-card-summary-list__value' },
  classes: 'sas-card-summary-list__row',
})

export const actionsForStatus = (dutyToRefer: DutyToReferDto): SummaryListRow[] => {
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
        summaryListRow(
          'Submitted',
          `${formatDate(dutyToRefer?.submitted)} (${formatDate(dutyToRefer?.submitted, 'days ago/in')})`,
        ),
      ]
    default:
      return []
  }
}
