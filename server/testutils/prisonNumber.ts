import { faker } from '@faker-js/faker'

export default () =>
  `${faker.string.alpha(1).toUpperCase()}${faker.string.numeric(4)}${faker.string.alpha(2).toUpperCase()}`
