import { faker } from '@faker-js/faker'

const tierLevels = ['A', 'B', 'C', 'D']
const tierSubLevels = ['1', '2', '3']

export default () =>
  `${faker.helpers.arrayElement(tierLevels)}${faker.helpers.arrayElement(tierSubLevels)}${faker.helpers.maybe(() => 'S') || ''}`
