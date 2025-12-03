import { faker } from '@faker-js/faker'

export default () => `${faker.number.int({ min: 2017, max: new Date().getFullYear() })}/${faker.string.numeric(7)}`
