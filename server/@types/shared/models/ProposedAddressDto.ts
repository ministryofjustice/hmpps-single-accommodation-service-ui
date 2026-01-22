export type ProposedAddress = {
  housingArrangementType:
    | 'FRIENDS_OR_FAMILY'
    | 'SOCIAL_RENTED'
    | 'PRIVATE_RENTED_WHOLE_PROPERTY'
    | 'PRIVATE_RENTED_ROOM'
    | 'OWNED'
    | 'OTHER'
  housingArrangementTypeDescription: string
  settledType: 'SETTLED' | 'TRANSIENT'
  status: 'NOT_CHECKED_YET' | 'PASSED' | 'FAILED'
  address: {
    postcode: string
    subBuildingName: string
    buildingName: string
    buildingNumber: string
    thoroughfareName: string
    dependentLocality: string
    postTown: string
    county: string
    country: string
    uprn: string
  }
}
