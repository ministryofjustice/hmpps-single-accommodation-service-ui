import { EligibilityV2Dto } from '@sas/api'
import { Factory } from 'fishery'
import crn from '../crn'
import serviceResultFactory from './serviceResult'
import dtrServiceResultFactory from './dtrServiceResult'
import crsServiceResultFactory from './crsServiceResult'

export default Factory.define<EligibilityV2Dto>(() => {
  const cas1 = { serviceResult: serviceResultFactory.cas1().build(), actionPosition: -1 }
  const cas2 = { serviceResult: serviceResultFactory.cas2().build(), actionPosition: -1 }
  const cas3 = { serviceResult: serviceResultFactory.cas3().build(), actionPosition: -1 }
  const crs = crsServiceResultFactory.build()
  const dtr = dtrServiceResultFactory.build()
  const pa = { serviceResult: serviceResultFactory.pa().build(), actionPosition: -1 }
  const ppc = { serviceResult: serviceResultFactory.ppc().build(), actionPosition: -1 }

  return {
    crn: crn(),
    cas1,
    cas2,
    cas3,
    crs,
    dtr,
    pa,
    ppc,
  }
})
