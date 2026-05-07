import { ProposedAddressFormData } from '@sas/ui'
import { NoteCommand, ProposedAccommodationDto, UpstreamFailureDto } from '@sas/api'
import { ProposedAddressesClient } from '../data'
import { formDataToRequestBody } from '../utils/proposedAddresses'

export default class ProposedAddressesService {
  constructor(private readonly proposedAddressesClient: ProposedAddressesClient) {}

  async getProposedAddresses(
    token: string,
    crn: string,
  ): Promise<{
    upstreamFailures?: UpstreamFailureDto[]
    data: {
      proposed: ProposedAccommodationDto[]
      failedChecks: ProposedAccommodationDto[]
    }
  }> {
    const { data, upstreamFailures } = await this.proposedAddressesClient.getProposedAddresses(token, crn)

    return {
      upstreamFailures,
      data: {
        proposed: data.filter(address => address.verificationStatus !== 'FAILED'),
        failedChecks: data.filter(address => address.verificationStatus === 'FAILED'),
      },
    }
  }

  async getProposedAddress(token: string, crn: string, id: string) {
    return this.proposedAddressesClient.getProposedAddress(token, crn, id)
  }

  submit(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    return this.proposedAddressesClient.submit(token, crn, formDataToRequestBody(proposedAddressData))
  }

  update(token: string, crn: string, proposedAddressData: ProposedAddressFormData) {
    return this.proposedAddressesClient.update(
      token,
      crn,
      proposedAddressData.id,
      formDataToRequestBody(proposedAddressData),
    )
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.proposedAddressesClient.getTimeline(token, crn, id)
  }

  async submitTimelineNote(token: string, crn: string, id: string, note: NoteCommand) {
    return this.proposedAddressesClient.submitTimelineNote(token, crn, id, note)
  }
}
