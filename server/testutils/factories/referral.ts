import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import { Referral } from '../../@types/shared/models/Referral'
import casType from '../casType'
import casReferralStatus from '../casReferralStatus'

export default Factory.define<Referral>(() => ({
  id: faker.string.uuid(),
  type: casType(),
  status: casReferralStatus(),
  date: faker.date.past().toISOString(),
}))
