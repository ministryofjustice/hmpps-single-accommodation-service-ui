import { Request } from 'express'
import { mock } from 'jest-mock-extended'
import { ErrorMessages, ErrorSummary } from '@sas/ui'
import {
  addErrorToFlash,
  addGenericErrorToFlash,
  errorDateParts,
  fetchErrorsAndUserInput,
  addUserInputToFlash,
  generateErrorMessages,
  generateErrorSummary,
  validateAndFlashErrors,
  validateMandatoryText,
  validateRadioButton,
  validateSelect,
  validateMaxLength,
  validateAutocomplete,
  validateDateInPast,
  validateDateTodayOrPast,
  validateDateNotBefore,
  validateDateField,
  validatePostcode,
  validateDateWithinLastXMonths,
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

describe('errorDateParts', () => {
  it('returns the part named in the message', () => {
    expect(errorDateParts('Submission date year must include 4 numbers')).toEqual(['year'])
  })

  it('returns each part named in the message', () => {
    expect(errorDateParts('Submission date must include a month and a year')).toEqual(['month', 'year'])
  })

  it('returns all parts when none are named', () => {
    expect(errorDateParts('Enter a submission date')).toEqual(['day', 'month', 'year'])
  })

  it('returns all parts if the error message does not refer to a missing field', () => {
    expect(errorDateParts('Date must be within the last month')).toEqual(['day', 'month', 'year'])
  })

  it('ignores case when matching parts', () => {
    expect(errorDateParts('Year of birth must include 4 numbers')).toEqual(['year'])
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

  it('links a date field to the first part with an error', () => {
    const errors = {
      submissionDate: 'Submission date must include a month and a year',
      field2: 'error 2',
    }
    const result = generateErrorSummary(errors, ['submissionDate'])
    expect(result).toEqual([
      { text: 'Submission date must include a month and a year', href: '#submissionDate-month' },
      { text: 'error 2', href: '#field2' },
    ])
  })

  it('links a whole date error to the day input', () => {
    const errors = { submissionDate: 'Enter a submission date' }
    const result = generateErrorSummary(errors, ['submissionDate'])
    expect(result).toEqual([{ text: 'Enter a submission date', href: '#submissionDate-day' }])
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

  it('flashes a date field error linked to the correct input', () => {
    const result = validateAndFlashErrors(request, { submissionDate: 'Submission date year must include 4 numbers' }, [
      'submissionDate',
    ])
    expect(result).toBe(false)
    expect(request.flash).toHaveBeenCalledWith(
      'errorSummary',
      JSON.stringify([{ text: 'Submission date year must include 4 numbers', href: '#submissionDate-year' }]),
    )
  })
})

describe('validators', () => {
  describe.each([
    ['validateMandatoryText', validateMandatoryText, 'Enter'],
    ['validateRadioButton', validateRadioButton, 'Select'],
    ['validateSelect', validateSelect, 'Select'],
    ['validateAutocomplete', validateAutocomplete, 'Select', 'from the list'],
  ])('validateRequired validators: %s', (_name, validator, action, suffix = '') => {
    it.each([
      ['a value', 'reason', undefined, undefined],
      [undefined, 'reason', undefined, `${action} a reason${suffix ? ` ${suffix}` : ''}`],
      ['', 'reason', undefined, `${action} a reason${suffix ? ` ${suffix}` : ''}`],
      [undefined, 'address', undefined, `${action} an address${suffix ? ` ${suffix}` : ''}`],
      [undefined, 'email address', undefined, `${action} an email address${suffix ? ` ${suffix}` : ''}`],
      [undefined, 'RSVP', 'an', `${action} an RSVP${suffix ? ` ${suffix}` : ''}`],
    ])('returns expected error for value "%s" and label "%s"', (value, label, prefix, expected) => {
      expect(validator(value, label, prefix)).toBe(expected)
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

  describe('validateDateInPast', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01'))
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
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01'))
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

  describe('validateDateWithinLastXMonths', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-13'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it.each([
      { title: 'date in the future', date: { day: '14', month: '7', year: '2026' }, months: 3, expected: undefined },
      {
        title: 'date within last 6 months',
        date: { day: '13', month: '1', year: '2026' },
        months: 6,
        expected: undefined,
      },
      {
        title: 'date over 6 months ago',
        date: { day: '12', month: '1', year: '2026' },
        months: 6,
        expected: 'Date must be within the last 6 months',
      },
      {
        title: 'date within last month',
        date: { day: '13', month: '6', year: '2026' },
        months: 1,
        expected: undefined,
      },
      {
        title: 'date over a month ago',
        date: { day: '12', month: '6', year: '2026' },
        months: 1,
        expected: 'Date must be within the last month',
      },
      {
        title: 'invalid date',
        date: { day: '34', month: '', year: '2026' },
        months: 1,
        expected: undefined,
      },
    ])('returns the expected result for $title', ({ date, months, expected }) => {
      expect(validateDateWithinLastXMonths(date, months, 'Date')).toBe(expected)
    })
  })

  describe('validateDateField', () => {
    it.each([
      ['a valid date', { day: '31', month: '12', year: '2016' }, 'Submission date', undefined],
      ['a valid end of February date', { day: '28', month: '02', year: '2016' }, 'Start date', undefined],
      ['a valid leap year date', { day: '29', month: '2', year: '2024' }, 'Birth date', undefined],
      ['all parts missing', {}, 'Start date', 'Enter a start date'],
      ['all parts blank', { day: '', month: '', year: '' }, 'Submission date', 'Enter a submission date'],
      [
        'all parts undefined',
        { day: undefined, month: undefined, year: undefined },
        'Outcome date',
        'Enter an outcome date',
      ],
      [
        'only the day present',
        { day: '31', month: '', year: '' },
        'Start date',
        'Start date must include a month and a year',
      ],
      [
        'only the month present',
        { day: '', month: '12', year: '' },
        'Start date',
        'Start date must include a day and a year',
      ],
      [
        'only the year present',
        { day: '', month: '', year: '2026' },
        'Start date',
        'Start date must include a day and a month',
      ],
      ['the day missing', { day: '', month: '12', year: '2026' }, 'Start date', 'Start date must include a day'],
      ['the month missing', { day: '31', month: '', year: '2026' }, 'Start date', 'Start date must include a month'],
      ['the year missing', { day: '31', month: '12', year: '' }, 'Start date', 'Start date must include a year'],
      [
        'a two digit year',
        { day: '31', month: '12', year: '26' },
        'Submission date',
        'Submission date year must include 4 numbers',
      ],
      [
        'a five digit year',
        { day: '31', month: '12', year: '20166' },
        'Start date',
        'Start date year must include 4 numbers',
      ],
      [
        'an out of range day',
        { day: '32', month: '12', year: '2016' },
        'Submission date',
        'Submission date must be a real date',
      ],
      [
        'an out of range month',
        { day: '31', month: '13', year: '2016' },
        'Start date',
        'Start date must be a real date',
      ],
      [
        'a nonleap year 29 February',
        { day: '29', month: '2', year: '2026' },
        'Birth date',
        'Birth date must be a real date',
      ],
    ])('returns the expected error for %s', (_description, value, label, expected) => {
      expect(validateDateField(value, label)).toBe(expected)
    })

    it('uses the given year label in the year length error', () => {
      const value = { day: '31', month: '12', year: '20166' }
      expect(validateDateField(value, 'Main occupier date of birth', 'Main occupier year of birth')).toBe(
        'Main occupier year of birth must include 4 numbers',
      )
    })
  })

  describe('validatePostcode', () => {
    it.each([
      ['M1 1AA', undefined],
      ['AA1 1AA', undefined],
      ['AA11AA', undefined],
      [undefined, 'Enter a UK postcode'],
      ['', 'Enter a UK postcode'],
      ['NOOO', 'Enter a full UK postcode'],
      ['1234567890', 'Enter a full UK postcode'],
      ['M145BNNNN', 'Enter a full UK postcode'],
      ['M14 5BNNNN', 'Enter a full UK postcode'],
      ['M23', 'Enter a full UK postcode'],
    ])('returns the expected error for value %s', (value, expected) => {
      expect(validatePostcode(value)).toBe(expected)
    })
  })
})
