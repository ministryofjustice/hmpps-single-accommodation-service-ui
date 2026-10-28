import { faker } from '@faker-js/faker'

export default () => randomCrn()
const randomCrn = () => `${faker.string.alpha(1).toUpperCase()}${faker.string.numeric(6)}`
export const listOfCrns = (count: number) => Array.from({ length: count }, randomCrn).join(',')
