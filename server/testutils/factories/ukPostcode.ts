import { faker } from '@faker-js/faker/locale/en_GB'

// faker's en_GB zipCode() can emit postcodes that fail our isValidUKPostcode regex
// this generates one that always matches it.
// eslint-disable-next-line import/prefer-default-export
export const ukPostcode = (): string => faker.helpers.fromRegExp(/[A-Z]{1,2}[0-9][0-9A-Z]? [0-9][A-Z]{2}/)
