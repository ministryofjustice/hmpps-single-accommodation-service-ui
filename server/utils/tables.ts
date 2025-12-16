import { TableCell } from '@govuk/ui'
import { AccommodationReferralDto as Referral } from '@sas/api'
import { nunjucksInline } from './nunjucksSetup'
import { formatDate, referralStatusTag } from './format'
import { htmlContent } from './utils'

export const textCell = (type: string): TableCell => ({ text: type })
export const statusCell = (status: Referral['status']): TableCell => ({ html: referralStatusTag(status) })
export const dateCell = (date: string): TableCell => ({ text: formatDate(date) })
export const linksCell = (links: Array<{ text: string; href: string }>) => {
  return htmlContent(nunjucksInline().render('components/tables/linksCell.njk', { links }))
}
