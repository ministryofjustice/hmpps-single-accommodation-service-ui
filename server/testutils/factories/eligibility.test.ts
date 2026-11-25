import { crsServiceResultFactory, dtrServiceResultFactory, eligibilityFactory, serviceResultFactory } from './index'

describe('eligibility factories', () => {
  it('builds V2 results for every service', () => {
    const eligibility = eligibilityFactory.build()
    const services = ['cas1', 'cas2', 'cas3', 'crs', 'dtr', 'pa', 'ppc'] as const

    services.forEach(service => {
      const result = eligibility[service]
      expect(result.serviceResult.serviceStatus).toMatch(new RegExp(`^${service.toUpperCase()}_`))
      expect(result.serviceResult.failureReasons).toEqual(expect.any(Array))
      expect(result.actionPosition).toBe(-1)
    })
    expect(eligibility).not.toHaveProperty('caseActions')
  })

  it.each([
    ['DTR_NOT_REQUIRED', false],
    ['DTR_UPCOMING', false],
    ['DTR_NOT_STARTED', false],
    ['DTR_SUBMITTED', true],
    ['DTR_ACCEPTED', true],
    ['DTR_NOT_ACCEPTED', true],
  ] as const)('builds a %s result with submission: %s', (serviceStatus, hasSubmission) => {
    const result = dtrServiceResultFactory.build({ serviceResult: serviceResultFactory.build({ serviceStatus }) })

    expect(result.serviceResult.serviceStatus).toBe(serviceStatus)
    expect(result.submission != null).toBe(hasSubmission)
  })

  it.each([
    ['CRS_NOT_REQUIRED', false],
    ['CRS_NOT_STARTED_REFERRAL', false],
    ['CRS_SUBMITTED', true],
  ] as const)('builds a %s result with submission: %s', (serviceStatus, hasSubmission) => {
    const result = crsServiceResultFactory.build({ serviceResult: serviceResultFactory.build({ serviceStatus }) })

    expect(result.serviceResult.serviceStatus).toBe(serviceStatus)
    expect(result.commissionedRehabilitativeServices != null).toBe(hasSubmission)
  })
})
