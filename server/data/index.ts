/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
/* istanbul ignore file */

import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import { createRedisClient } from './redisClient'
import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import logger from '../../logger'
import SasClient from './sasClient'
import CasesClient from './casesClient'
import ReferralsClient from './referralsClient'
import EligibilityClient from './eligibilityClient'
import DutyToReferClient from './dutyToReferClient'
import ProposedAddressesClient from './proposedAddressesClient'

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
    referralsClient: new ReferralsClient(hmppsAuthClient),
    eligibilityClient: new EligibilityClient(hmppsAuthClient),
    dutyToReferClient: new DutyToReferClient(hmppsAuthClient),
    proposedAddressesClient: new ProposedAddressesClient(hmppsAuthClient),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export {
  AuthenticationClient,
  HmppsAuditClient,
  SasClient,
  CasesClient,
  ReferralsClient,
  EligibilityClient,
  DutyToReferClient,
  ProposedAddressesClient,
}
