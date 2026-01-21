import { PrivateAddressClient } from '../data'

export default class PrivateAddressService {
  constructor(private readonly privateAddressClient: PrivateAddressClient) {}

  submit(token: string, crn: string, privateAddressData: Record<string, unknown>) {
    return this.privateAddressClient.submit(token, crn, privateAddressData)
  }
}
