export type TextContent = {
  text: string
  html?: never
}

export type HtmlContent = {
  html: string
  text?: never
}

export type TextOrHtmlContent = TextContent | HtmlContent

export type HtmlAttributes = Record<string, string>

export type TableCell = TextOrHtmlContent & {
  /**
   * Specify format of a cell. Currently only "numeric" is used.
   */
  format?: string

  /**
   * Classes to add to the table cell.
   */
  classes?: string

  /**
   * How many columns a cell extends.
   */
  colspan?: number

  /**
   * How many rows a cell extends.
   */
  rowspan?: number

  /**
   * HTML attributes to add to the cell.
   */
  attributes?: HtmlAttributes
}

export type TableRow = TableCell[]

export type SummaryListActionItem = TextOrHtmlContent & {
  href: string
  visuallyHiddenText?: string
  classes?: string
  attributes?: HtmlAttributes
}

export type SummaryListActions = {
  items?: SummaryListActionItem[]
  classes?: string
}

export type SummaryListRow = {
  classes?: string
  key: TextOrHtmlContent & { classes?: string }
  value: TextOrHtmlContent & { classes?: string }
  actions?: SummaryListActions
}

export type SummaryList = {
  classes?: string
  attributes?: HtmlAttributes
  rows: SummaryListRow[]
}
