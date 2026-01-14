export interface ErrorSummary {
  text: string
  href: string
}

export interface ErrorMessage {
  text: string
  attributes: Record<string, string | boolean>
}

export interface ErrorMessages {
  [key: string]: ErrorMessage
}
