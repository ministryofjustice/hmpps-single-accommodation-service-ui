import { ReferenceDataClient } from '../data'

export default class ReferenceDataService {
  constructor(private readonly referenceDataClient: ReferenceDataClient) {}

  getLocalAuthorities() {
    return this.referenceDataClient.getReferenceData('LOCAL_AUTHORITY_AREAS')
  }
}
