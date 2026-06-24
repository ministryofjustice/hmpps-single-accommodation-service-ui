import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import { ErrorMessages, ErrorSummary } from '@sas/ui'
import {
  addErrorToFlash,
  addGenericErrorToFlash,
  fetchErrorsAndUserInput,
  addUserInputToFlash,
  generateErrorMessages,
  generateErrorSummary,
  isValidUKPostcode,
  validateAndFlashErrors,
  validateMandatoryText,
  validateRadioButton,
  validateSelect,
  validateMaxLength,
  validateAutocomplete,
  validateDateFull,
  validateDateParts,
  validateDateYearLength,
  validateRealDate,
  validateDateInPast,
  validateDateTodayOrPast,
  validateDateNotBefore,
  validateDateField,
  validatePostcode,
} from './validation'

describe('fetchErrorsAndUserInput', () => {
  const request = mock<Request>({})

  let errors: ErrorMessages
  let errorSummary: ErrorSummary[]
  let userInput: Record<string, unknown>

  beforeEach(() => {
    ;(request.flash as jest.Mock).mockImplementation((message: string) => {
      return {
        errors: errors ? [JSON.stringify(errors)] : [],
        errorSummary: errorSummary ? [JSON.stringify(errorSummary)] : [],
        userInput: userInput ? [JSON.stringify(userInput)] : [],
      }[message]
    })
  })

  it('returns default values if there is nothing present', () => {
    const result = fetchErrorsAndUserInput(request)

    expect(result).toEqual({ errors: {}, errorSummary: [], userInput: {} })
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
    userInput = {
      field1: 'user input 1',
      field2: 'user input 2',
    }

    const result = fetchErrorsAndUserInput(request)
    expect(result).toEqual({ errors, errorSummary, userInput })
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

describe('addGenericErrorToFlash', () => {
  it('adds a generic, non-field error to flash', () => {
    const request = mock<Request>({})

    addGenericErrorToFlash(request, 'there was an error')

    expect(request.flash).toHaveBeenCalledWith(
      'errorSummary',
      JSON.stringify([
        {
          text: 'there was an error',
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

describe('addUserInputToFlash', () => {
  const request = mock<Request>({})

  it('saves the user input to flash', () => {
    request.body = {
      foo: 'bar',
      baz: '1',
    }

    addUserInputToFlash(request)

    expect(request.flash).toHaveBeenCalledWith('userInput', '{"foo":"bar","baz":"1"}')
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

  it('returns false and flashes errors and user input if there are errors', () => {
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

describe('validators', () => {
  describe('isValidUKPostcode', () => {
    it.each([
      [false, ''],
      [false, '1234567890'],
      [false, 'NOOO'],
      [false, 'M145BNNNN'],
      [false, 'M14 5BNNNN'],
      [false, 'M23'],
      [true, 'AA1 1AA'],
      [true, 'M1 1AA'],
    ])('returns %s for %s', (expected, input) => {
      expect(isValidUKPostcode(input)).toBe(expected)
    })
  })

  describe('validateMandatoryText', () => {
    it.each([
      ['a value', 'reason', undefined],
      [undefined, 'reason', 'Enter a reason'],
      ['', 'reason', 'Enter a reason'],
      [undefined, 'address', 'Enter an address'],
      [undefined, 'Email address', 'Enter an Email address'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateMandatoryText(value, label)).toBe(expected)
    })
  })

  describe('validateMaxLength', () => {
    it.each([
      ['a value', 'Reason', 256, undefined],
      [undefined, 'Reason', 10, undefined],
      ['', 'Reason', 10, undefined],
      ['a'.repeat(10), 'Reason', 10, undefined],
      ['a'.repeat(11), 'Reason', 10, 'Reason must be 10 characters or less'],
      ['Some long address', 'Address', 16, 'Address must be 16 characters or less'],
    ])('returns the expected error for value %s and label %s', (value, label, length, expected) => {
      expect(validateMaxLength(value, label, length)).toBe(expected)
    })
  })

  describe('validateRadioButton && validateSelect', () => {
    it.each([
      ['a value', 'reason', undefined],
      [undefined, 'reason', 'Select a reason'],
      ['', 'reason', 'Select a reason'],
      [undefined, 'address', 'Select an address'],
      [undefined, 'Email address', 'Select an Email address'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateRadioButton(value, label)).toBe(expected)
      expect(validateSelect(value, label)).toBe(expected)
    })
  })

  describe('validateAutocomplete', () => {
    it.each([
      ['a value', 'reason', undefined],
      [undefined, 'reason', 'Select a reason from the list'],
      ['', 'reason', 'Select a reason from the list'],
      [undefined, 'address', 'Select an address from the list'],
      [undefined, 'Email address', 'Select an Email address from the list'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateAutocomplete(value, label)).toBe(expected)
    })
  })

  describe('validateDateFull', () => {
    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'start date', undefined],
      [{ day: '31', month: '', year: '' }, 'start date', undefined],
      [{}, 'start date', 'Enter a start date'],
      [{ day: '', month: '', year: '' }, 'start date', 'Enter a start date'],
      [{ day: '', month: '', year: '' }, 'outcome date', 'Enter an outcome date'],
      [{ day: undefined, month: undefined, year: undefined }, 'start date', 'Enter a start date'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateFull(value, label)).toBe(expected)
    })
  })

  describe('validateDateParts', () => {
    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'Start date', undefined],
      [{ day: '', month: '', year: '' }, 'Start date', undefined],
      [{ day: '31', month: '', year: '' }, 'Start date', 'Start date must include a month and a year'],
      [{ day: '', month: '12', year: '' }, 'Start date', 'Start date must include a day and a year'],
      [{ day: '', month: '', year: '2026' }, 'Start date', 'Start date must include a day and a month'],
      [{ day: '', month: '12', year: '2026' }, 'Start date', 'Start date must include a day'],
      [{ day: '31', month: '', year: '2026' }, 'Start date', 'Start date must include a month'],
      [{ day: '31', month: '12', year: '' }, 'Start date', 'Start date must include a year'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateParts(value, label)).toBe(expected)
    })
  })

  describe('validateDateYearLength', () => {
    it.each([
      [{ year: '2016' }, 'Start date', undefined],
      [{ year: '' }, 'Start date', undefined],
      [{ year: '26' }, 'Start date', 'Start date must include 4 numbers'],
      [{ year: '20166' }, 'Start date', 'Start date must include 4 numbers'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateYearLength(value, label)).toBe(expected)
    })
  })

  describe('validateRealDate', () => {
    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'Start date', undefined],
      [{ day: '28', month: '02', year: '2016' }, 'Start date', undefined],
      [{ day: '29', month: '2', year: '2024' }, 'Start date', undefined],
      [{ day: '', month: '', year: '' }, 'Start date', undefined],
      [{ day: '32', month: '12', year: '2016' }, 'Start date', 'Start date must be a real date'],
      [{ day: '31', month: '13', year: '201' }, 'Start date', 'Start date must be a real date'],
      [{ day: '29', month: '2', year: '2026' }, 'Start date', 'Start date must be a real date'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateRealDate(value, label)).toBe(expected)
    })
  })

  describe('validateDateInPast', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-1'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'Start date', undefined],
      [{ day: '31', month: '12', year: '2025' }, 'Start date', undefined],
      [{ day: '', month: '', year: '' }, 'Start date', undefined],
      [{ day: '32', month: '1', year: '2020' }, 'Start date', undefined],
      [{ day: '1', month: '1', year: '2026' }, 'Start date', 'Start date must be in the past'],
      [{ day: '31', month: '12', year: '2030' }, 'Start date', 'Start date must be in the past'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateInPast(value, label)).toBe(expected)
    })
  })

  describe('validateDateTodayOrPast', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-1'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'Start date', undefined],
      [{ day: '1', month: '1', year: '2026' }, 'Start date', undefined],
      [{ day: '', month: '', year: '' }, 'Start date', undefined],
      [{ day: '32', month: '1', year: '2020' }, 'Start date', undefined],
      [{ day: '2', month: '1', year: '2026' }, 'Start date', 'Start date must be today or in the past'],
      [{ day: '31', month: '12', year: '2030' }, 'Start date', 'Start date must be today or in the past'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateTodayOrPast(value, label)).toBe(expected)
    })
  })

  describe('validateDateNotBefore', () => {
    it.each([
      [
        { day: '31', month: '12', year: '2016' },
        { day: '31', month: '12', year: '2026' },
        'start date',
        'end date',
        undefined,
      ],
      [
        { day: '31', month: '12', year: '2016' },
        { day: '31', month: '12', year: '2016' },
        'start date',
        'end date',
        undefined,
      ],
      [
        { day: '31', month: '12', year: '2026' },
        { day: '31', month: '12', year: '2016' },
        'start date',
        'end date',
        'The end date cannot be before the start date',
      ],
      [
        { day: '31', month: '12', year: '2016' },
        { day: '31', month: '12', year: '2000' },
        'start date',
        'end date',
        'The end date cannot be before the start date',
      ],
    ])('returns the expected error for date %s before %s', (startDate, endDate, startLabel, endLabel, expected) => {
      expect(validateDateNotBefore(endDate, startDate, endLabel, startLabel)).toBe(expected)
    })
  })

  describe('validateDateField', () => {
    it.each([
      [{ day: '31', month: '12', year: '2016' }, 'Submission date', undefined],
      [{ day: '', month: '', year: '' }, 'Submission date', 'Enter a submission date'],
      [{ day: '', month: '12', year: '2026' }, 'Submission date', 'Submission date must include a day'],
      [{ day: '31', month: '12', year: '26' }, 'Submission date', 'Submission date must include 4 numbers'],
      [{ day: '32', month: '12', year: '2016' }, 'Submission date', 'Submission date must be a real date'],
    ])('returns the expected error for value %s and label %s', (value, label, expected) => {
      expect(validateDateField(value, label)).toBe(expected)
    })
  })

  describe('validatePostcode', () => {
    it.each([
      ['M1 1AA', undefined],
      ['AA1 1AA', undefined],
      [undefined, 'Enter a UK postcode'],
      ['', 'Enter a UK postcode'],
      ['NOOO', 'Enter a full UK postcode, like AA3 1AB'],
      ['M23', 'Enter a full UK postcode, like AA3 1AB'],
    ])('returns the expected error for value %s', (value, expected) => {
      expect(validatePostcode(value)).toBe(expected)
    })
  })
})
