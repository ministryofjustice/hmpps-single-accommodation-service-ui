import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import serviceResultFactory from './serviceResult'
import dtrServiceResultFactory from './dtrServiceResult'
import crsServiceResultFactory from './crsServiceResult'

export default Factory.define<EligibilityDto>(() => {
  const cas1 = { serviceResult: serviceResultFactory.build() }
  const cas3 = { serviceResult: serviceResultFactory.build() }
  const crs = crsServiceResultFactory.build()
  const dtr = dtrServiceResultFactory.build()
  const pa = { serviceResult: serviceResultFactory.pa().build() }

  return {
    crn: crn(),
    caseActions: [cas1, cas3, crs, dtr, pa].flatMap(result => result.serviceResult.action).filter(Boolean),
    cas1,
    cas3,
    crs,
    dtr,
    pa,
  }
})
