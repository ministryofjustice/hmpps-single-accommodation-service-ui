import { DutyToReferDto } from '@sas/api'
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

export const actionsForStatus = (dutyToRefer: DutyToReferDto): { term: string; description: string }[] => {
  const { status } = dutyToRefer
  switch (status) {
    case 'NOT_ELIGIBLE':
    case 'UPCOMING':
      return []
    case 'NOT_STARTED':
      return [{ term: 'Local authority (likely)', description: dutyToRefer?.submittedTo ?? '' }]
    case 'SUBMITTED':
      return [
        { term: 'Submitted to', description: dutyToRefer?.submittedTo ?? '' },
        { term: 'Reference', description: dutyToRefer?.reference ?? '' },
        {
          term: 'Submitted',
          description: `${formatDate(dutyToRefer?.submitted)} (${formatDate(dutyToRefer?.submitted, 'days ago/in')})`,
        },
      ]
    default:
      return []
  }
}
