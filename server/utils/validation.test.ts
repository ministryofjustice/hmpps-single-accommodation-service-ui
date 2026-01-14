import { Request } from 'express'
import { createMock } from '@golevelup/ts-jest'
import { ErrorMessages, ErrorSummary } from '@sas/ui'
import { fetchErrors } from './validation'

describe('fetchErrors', () => {
  const request = createMock<Request>({})

  let errors: ErrorMessages
  let errorSummary: ErrorSummary[]

  beforeEach(() => {
    ;(request.flash as jest.Mock).mockImplementation((message: string) => {
      return {
        errors: errors ? [JSON.stringify(errors)] : [],
        errorSummary: errorSummary ? [JSON.stringify(errorSummary)] : [],
      }[message]
    })
  })

  it('returns default values if there is nothing present', () => {
    const result = fetchErrors(request)

    expect(result).toEqual({ errors: {}, errorSummary: [] })
  })

  it('fetches the values from the flash', () => {
    errors = { errorField: { text: "there's an error", attributes: {} } }
    errorSummary = [{ text: "there's an error", href: '#errorField' }]

    const result = fetchErrors(request)
    expect(result).toEqual({ errors, errorSummary })
  })
})
