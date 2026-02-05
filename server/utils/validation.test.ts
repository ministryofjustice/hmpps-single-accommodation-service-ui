import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import { ErrorMessages, ErrorSummary } from '@sas/ui'
import {
  addErrorToFlash,
  fetchErrors,
  generateErrorMessages,
  generateErrorSummary,
  validateAndFlashErrors,
} from './validation'

describe('fetchErrors', () => {
  const request = mock<Request>({})

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
    errors = {
      errorField1: { text: "there's an error 1" },
      errorField2: { text: "there's an error 2" },
    }
    errorSummary = [
      { text: "there's an error 1", href: '#errorField1' },
      { text: "there's an error 2", href: '#errorField2' },
    ]

    const result = fetchErrors(request)
    expect(result).toEqual({ errors, errorSummary })
  })
})

describe('addErrorToFlash', () => {
  const request = mock<Request>({})

  it('adds error to flash', () => {
    const field = 'errorField'
    const errorText = 'there was an error'

    addErrorToFlash(request, field, errorText)
    expect(request.flash).toHaveBeenCalledWith(
      'errors',
      JSON.stringify({
        errorField: {
          text: 'there was an error',
        },
      }),
    )
    expect(request.flash).toHaveBeenCalledWith(
      'errorSummary',
      JSON.stringify([
        {
          text: 'there was an error',
          href: `#errorField`,
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
      field1: { text: 'error 1' },
      field2: { text: 'error 2' },
    })
  })
})

describe('validateAndFlashErrors', () => {
  const request = mock<Request>({})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true if there are no errors', () => {
    const result = validateAndFlashErrors(request, {})
    expect(result).toBe(true)
    expect(request.flash).not.toHaveBeenCalled()
  })

  it('returns false and flashes errors if there are errors', () => {
    const errors = {
      field1: 'error 1',
      field2: 'error 2',
    }
    const result = validateAndFlashErrors(request, errors)
    expect(result).toBe(false)
    expect(request.flash).toHaveBeenCalledWith(
      'errors',
      JSON.stringify({
        field1: { text: 'error 1' },
        field2: { text: 'error 2' },
      }),
    )
    expect(request.flash).toHaveBeenCalledWith(
      'errorSummary',
      JSON.stringify([
        { text: 'error 1', href: '#field1' },
        { text: 'error 2', href: '#field2' },
      ]),
    )
  })
})
