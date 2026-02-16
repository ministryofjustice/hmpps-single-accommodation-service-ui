import { TableCell } from '@govuk/ui'
import { formatDate } from './dates'
import { renderMacro } from './macros'

export const textCell = (text: string): TableCell => ({ text })

export const htmlCell = (html: string): TableCell => ({ html })

export const dateCell = (date: string): TableCell => ({ text: formatDate(date) })

export const linksCell = (links: Array<{ text: string; href: string }>) => renderMacro('linksCell', { links })
