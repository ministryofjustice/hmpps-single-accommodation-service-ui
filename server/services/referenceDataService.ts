import { ReferenceDataClient } from '../data'

export default class ReferenceDataService {
  constructor(private readonly referenceDataClient: ReferenceDataClient) {}

  getLocalAuthorities(token: string) {
    return this.referenceDataClient.getReferenceData(token, 'LOCAL_AUTHORITY_AREAS')
  }
}
