export type TextContent = {
  text: string
  html?: never
}

export type HtmlContent = {
  html: string
  text?: never
}

export type TableCell = (TextContent | HtmlContent) & {
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
  attributes?: Record<string, string>
}

export type TableRow = TableCell[]
