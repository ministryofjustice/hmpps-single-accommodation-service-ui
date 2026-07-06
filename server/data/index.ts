import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { createRedisClient } from './redisClient'
import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import logger from '../../logger'
import SasClient from './sasClient'
import CasesClient from './casesClient'
import ReferenceDataClient from './referenceDataClient'
import ReferralsClient from './referralsClient'
import EligibilityClient from './eligibilityClient'
import DutyToReferClient from './dutyToReferClient'
import ProposedAddressesClient from './proposedAddressesClient'
import OsDataHubClient from './osDataHubClient'
import AccommodationClient from './accommodationClient'
import UserClient from './userClient'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => {
  const hmppsAuthClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  )

  return {
    applicationInfo,
    hmppsAuthClient,
    sasClient: new SasClient(hmppsAuthClient),
    hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
    casesClient: new CasesClient(hmppsAuthClient),
    referenceDataClient: new ReferenceDataClient(hmppsAuthClient),
    referralsClient: new ReferralsClient(hmppsAuthClient),
    eligibilityClient: new EligibilityClient(hmppsAuthClient),
    dutyToReferClient: new DutyToReferClient(hmppsAuthClient),
    proposedAddressesClient: new ProposedAddressesClient(hmppsAuthClient),
    osDataHubClient: new OsDataHubClient(),
    accommodationClient: new AccommodationClient(hmppsAuthClient),
    userClient: new UserClient(hmppsAuthClient),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export {
  AuthenticationClient,
  HmppsAuditClient,
  SasClient,
  CasesClient,
  ReferenceDataClient,
  ReferralsClient,
  EligibilityClient,
  DutyToReferClient,
  ProposedAddressesClient,
  OsDataHubClient,
  AccommodationClient,
  UserClient,
}
