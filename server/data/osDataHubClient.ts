import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { OsDataHubResponse } from '@sas/ui'
import config from '../config'
import logger from '../../logger'

export default class OsDataHubClient extends RestClient {
  constructor() {
    super('OS DataHub API client', config.apis.osDataHubApi, logger)
  }

  getByPostcode(postcode: string) {
    return this.get<OsDataHubResponse>({
      path: '/search/places/v1/postcode',
      query: { postcode },
      headers: { Key: config.apis.osDataHubApi.apiKey },
    })
  }
}
