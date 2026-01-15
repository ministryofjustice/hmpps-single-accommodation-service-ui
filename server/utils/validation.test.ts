import { Request } from 'express'
import { createMock } from '@golevelup/ts-jest'
import { ErrorMessages, ErrorSummary } from '@sas/ui'
import { addErrorToFlash, fetchErrors, generateErrorMessages, generateErrorSummary } from './validation'

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

describe('addErrorToFlash', () => {
  const request = createMock<Request>({})

  it('adds error to flash', () => {
    const field = 'error'
    const errorText = 'there was an error'

    addErrorToFlash(request, field, errorText)
    expect(request.flash).toHaveBeenCalledWith(
      'errors',
      JSON.stringify({
        [field]: {
          text: errorText,
          attributes: {
            [`data-cy-error-${field}`]: true,
          },
        },
      }),
    )
    expect(request.flash).toHaveBeenCalledWith(
      'errorSummary',
      JSON.stringify([
        {
          text: errorText,
          href: `#${field}`,
        },
      ]),
    )
  })
})

describe('generateErrorSummary', () => {
  it('returns an empty array if there are no errors', () => {
    const result = generateErrorSummary({})
    expect(result).toEqual([])
  })

  it('returns an empty array if errors is undefined', () => {
    const result = generateErrorSummary(undefined)
    expect(result).toEqual([])
  })

  it('generates the error summary', () => {
    const errors = {
      field1: 'error 1',
      field2: 'error 2',
    }
    const result = generateErrorSummary(errors)
    expect(result).toEqual([
      { text: 'error 1', href: '#field1' },
      { text: 'error 2', href: '#field2' },
    ])
  })
})

describe('generateErrorMessages', () => {
  it('returns an empty object if there are no errors', () => {
    const result = generateErrorMessages({})
    expect(result).toEqual({})
  })

  it('returns an empty object if errors is undefined', () => {
    const result = generateErrorMessages(undefined)
    expect(result).toEqual({})
  })

  it('generates the error messages', () => {
    const errors = {
      field1: 'error 1',
      field2: 'error 2',
    }
    const result = generateErrorMessages(errors)
    expect(result).toEqual({
      field1: { text: 'error 1', attributes: { 'data-cy-error-field1': true } },
      field2: { text: 'error 2', attributes: { 'data-cy-error-field2': true } },
    })
  })
})
