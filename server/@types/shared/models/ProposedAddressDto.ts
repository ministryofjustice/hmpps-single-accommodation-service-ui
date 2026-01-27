import { AddressDetailsDto } from './AddressDetailsDto'

export type ProposedAddressDto = {
  id?: string
  housingArrangementType:
    | 'FRIENDS_OR_FAMILY'
    | 'SOCIAL_RENTED'
    | 'PRIVATE_RENTED_WHOLE_PROPERTY'
    | 'PRIVATE_RENTED_ROOM'
    | 'OWNED'
    | 'OTHER'
  housingArrangementTypeDescription: string
  settledType: 'SETTLED' | 'TRANSIENT'
  status: 'NOT_CHECKED_YET' | 'CHECKS_PASSED' | 'CHECKS_FAILED' | 'CONFIRMED'
  address: AddressDetailsDto
  createdAt?: string
}
