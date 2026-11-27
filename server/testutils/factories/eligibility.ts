import { EligibilityDto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import serviceResultFactory from './serviceResult'
import dtrServiceResultFactory from './dtrServiceResult'
import crsServiceResultFactory from './crsServiceResult'

export default Factory.define<EligibilityDto>(() => {
  const cas1 = { serviceResult: serviceResultFactory.build() }
  const cas2 = { serviceResult: serviceResultFactory.build() }
  const cas3 = { serviceResult: serviceResultFactory.build() }
  const crs = crsServiceResultFactory.build()
  const dtr = dtrServiceResultFactory.build()
  const pa = { serviceResult: serviceResultFactory.pa().build() }
  const ppc = { serviceResult: serviceResultFactory.ppc().build() }

  return {
    crn: crn(),
    caseActions: [cas1, cas2, cas3, crs, dtr, pa, ppc].flatMap(result => result.serviceResult.action).filter(Boolean),
    cas1,
    cas2,
    cas3,
    crs,
    dtr,
    pa,
    ppc,
  }
})
