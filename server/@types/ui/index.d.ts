// TODO: Remove these types once the API response is updated
export type AddressDto = {
  line1: string
  line2?: string
  region?: string
  city: string
  postcode: string
}

export type AccommodationDto = {
  id: string
  type: 'prison' | 'cas1' | 'cas2' | 'cas2v2' | 'cas3' | 'private' | 'nfa'
  subtype?: 'owned' | 'rented' | 'lodging'
  name?: string // free text, eg "parent's home", etc or Prison name or CAS premises name
  isSettled?: boolean // false for CAS?
  qualifier?: 'remand' | 'licence' | 'bail'
  startDate?: string // known move in date or CAS booking start date, etc
  endDate?: string // actual end date (prison release or CAS booking end date) or licence end, etc
  address?: AddressDto
}
