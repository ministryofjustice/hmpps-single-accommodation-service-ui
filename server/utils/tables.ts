import { TableCell } from '@govuk/ui'
import { nunjucksInline } from './nunjucksSetup'
import { formatDate } from './format'
import { CasReferralStatus } from '../@types/shared/models/CasReferralStatus'
import { htmlContent, statusTag } from './utils'

export const textCell = (type: string): TableCell => ({ text: type })
export const statusCell = (status: CasReferralStatus): TableCell => ({ html: statusTag(status) })
export const dateCell = (date: string): TableCell => ({ text: formatDate(date) })
export const linksCell = (links: Array<{ text: string; href: string }>) => {
  return htmlContent(nunjucksInline().render('components/tables/linksCell.njk', { links }))
}
