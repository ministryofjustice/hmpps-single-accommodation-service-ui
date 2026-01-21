import { Request } from 'express'
import { PrivateAddressFormData } from '@sas/ui'
import { textContent, htmlContent } from './utils'
import uiPaths from '../paths/ui'
import MultiPageFormManager from './multiPageFormManager'
import { addErrorToFlash } from './validation'

export const summaryListRows = (privateAddressFormSessionData: PrivateAddressFormData, crn: string) => {
  const addressLines = [...Object.values(privateAddressFormSessionData.address || {})].filter(Boolean)

  return [
    {
      key: textContent('Address'),
      value: htmlContent(addressLines.join('<br />')),
      actions: {
        items: [{ text: 'Change', href: uiPaths.privateAddress.details({ crn }) }],
      },
    },
    {
      key: textContent("What will be James Taylor's housing arrangement at this address?"),
      value: textContent(privateAddressFormSessionData.arrangement),
      actions: {
        items: [{ text: 'Change', href: uiPaths.privateAddress.type({ crn }) }],
      },
    },
    {
      key: textContent('Will it be settled or transient?'),
      value: textContent(privateAddressFormSessionData.type),
      actions: {
        items: [{ text: 'Change', href: uiPaths.privateAddress.type({ crn }) }],
      },
    },
    {
      key: textContent('What is the status of the address checks?'),
      value: textContent(privateAddressFormSessionData.status),
      actions: {
        items: [{ text: 'Change', href: uiPaths.privateAddress.status({ crn }) }],
      },
    },
  ]
}

export const updateAddressFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'privateAddress'>) => {
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

export const validateAddressFromSession = (req: Request, sessionData: PrivateAddressFormData) => {
  const address = sessionData?.address
  const errors: Record<string, string> = {}

  if (!address.line1) {
    errors.addressLine1 = 'Enter address line 1'
  }
  if (!address.postcode) {
    errors.addressPostcode = 'Enter postcode'
  }
  if (!address.city) {
    errors.addressTown = 'Enter town or city'
  }
  if (!address.country) {
    errors.addressCountry = 'Enter country'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateArrangementFromQuery = async (
  req: Request,
  formDataManager: MultiPageFormManager<'privateAddress'>,
) => {
  const { arrangement, type } = req.query || {}
  if (arrangement || type) {
    {
      await formDataManager.update(req.params.crn, req.session, {
        arrangement: (arrangement as string) || '',
        type: (type as string) || '',
      })
    }
  }
}

export const validateArrangementFromSession = (req: Request, sessionData: PrivateAddressFormData) => {
  const errors: Record<string, string> = {}
  if (!sessionData?.arrangement) {
    errors.arrangement = 'Select an arrangement'
  }
  if (!sessionData?.type) {
    errors.type = 'Select a type'
  }

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([key, message]) => {
      addErrorToFlash(req, key, message)
    })
    return false
  }

  return true
}

export const updateStatusFromQuery = async (req: Request, formDataManager: MultiPageFormManager<'privateAddress'>) => {
  const { status } = req.query || {}
  if (status) {
    {
      await formDataManager.update(req.params.crn, req.session, {
        status: (status as string) || '',
      })
    }
  }
}

export const validateStatusFromSession = (req: Request, sessionData: PrivateAddressFormData) => {
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
