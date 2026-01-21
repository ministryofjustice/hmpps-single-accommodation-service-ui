import { Request } from 'express'
import { ProposedAddressFormData } from '@sas/ui'
import { textContent, htmlContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { addErrorToFlash } from './validation'

export const summaryListRows = (proposedAddressFormSessionData: ProposedAddressFormData, crn: string) => {
  const addressLines = [...Object.values(proposedAddressFormSessionData.address || {})].filter(Boolean)

  return [
    {
      key: textContent('Address'),
      value: htmlContent(addressLines.join('<br />')),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.details({ crn }) }],
      },
    },
    {
      key: textContent("What will be James Taylor's housing arrangement at this address?"),
      value: htmlContent(formatArrangement(proposedAddressFormSessionData)),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('Will it be settled or transient?'),
      value: textContent(proposedAddressFormSessionData.settledType),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.type({ crn }) }],
      },
    },
    {
      key: textContent('What is the status of the address checks?'),
      value: textContent(proposedAddressFormSessionData.status),
      actions: {
        items: [{ text: 'Change', href: uiPaths.proposedAddresses.status({ crn }) }],
      },
    },
  ]
}

const formatArrangement = (data: ProposedAddressFormData) => {
  const type = data.housingArrangementType || ''
  if (type === 'other') {
    return [type, data.housingArrangementTypeDescription].join('<br />')
  }
  return type
}

export const updateAddressFromQuery = async (
  req: Request,
  formDataManager: MultiPageFormManager<'proposedAddress'>,
) => {
  const { addressLine1, addressLine2, addressTown, addressCounty, addressPostcode, addressCountry } = req.query || {}
  if (addressLine1 || addressLine2 || addressTown || addressCounty || addressPostcode || addressCountry) {
    const addressParams = {
      line1: (addressLine1 as string) || '',
      line2: (addressLine2 as string) || '',
      city: (addressTown as string) || '',
      region: (addressCounty as string) || '',
      postcode: (addressPostcode as string) || '',
      country: (addressCountry as string) || '',
    }
    await formDataManager.update(req.params.crn, req.session, {
      address: addressParams,
    })
  }
}

export const validateAddressFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const address = sessionData?.address
  const errors: Record<string, string> = {}

  if (!address?.line1) {
    errors.addressLine1 = 'Enter address line 1, typically the building and street'
  } else if (address.line1.length > 200) {
    errors.addressLine1 = 'Address line 1 must be 200 characters or less'
  }
  if (address?.line2 && address?.line2.length > 200) {
    errors.addressLine2 = 'Address line 2 must be 200 characters or less'
  }
  if (!address?.postcode) {
    errors.addressPostcode = 'Enter postcode'
  } else if (address.postcode.length > 20) {
    errors.addressPostcode = 'Postal code or zip code must be 20 characters or less'
  }
  if (!address?.city) {
    errors.addressTown = 'Enter town or city'
  } else if (address.city.length > 100) {
    errors.addressTown = 'Town or city must be 100 characters or less'
  }
  if (address?.region && address?.region.length > 100) {
    errors.addressCounty = 'County must be 100 characters or less'
  }
  if (!address?.country) {
    errors.addressCountry = 'Enter country'
  } else if (address.country.length > 100) {
    errors.addressCountry = 'Country must be 100 characters or less'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateTypeFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { housingArrangementType, housingArrangementTypeDescription, settledType } = req.query || {}
  if (housingArrangementType || settledType) {
    await formDataManager.update(req.params.crn, req.session, {
      housingArrangementType: (housingArrangementType as string) || '',
      housingArrangementTypeDescription: (housingArrangementTypeDescription as string) || '',
      settledType: (settledType as string) || '',
    })
  }
}

export const validateTypeFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.housingArrangementType) {
    errors.housingArrangementType = 'Select a arrangement type'
  } else if (sessionData.housingArrangementType === 'other' && !sessionData.housingArrangementTypeDescription) {
    errors.housingArrangementTypeDescription = 'Enter the other arrangement type'
  }
  if (!sessionData?.settledType) {
    errors.settledType = 'Select a settled type'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateStatusFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'proposedAddress'>) => {
  const { status } = req.query || {}
  if (status) {
    await formDataManager.update(req.params.crn, req.session, {
      status: (status as string) || '',
    })
  }
}

export const validateStatusFromSession = (req: Request, sessionData: ProposedAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.status) {
    errors.status = 'Select a status'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}
