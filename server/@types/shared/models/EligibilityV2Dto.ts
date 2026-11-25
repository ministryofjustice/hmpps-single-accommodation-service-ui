/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1ServiceResultWrapper } from './Cas1ServiceResultWrapper'
import type { Cas2ServiceResultWrapper } from './Cas2ServiceResultWrapper'
import type { Cas3ServiceResultWrapper } from './Cas3ServiceResultWrapper'
import type { CrsServiceResultWrapper } from './CrsServiceResultWrapper'
import type { DtrServiceResultWrapper } from './DtrServiceResultWrapper'
import type { PaServiceResultWrapper } from './PaServiceResultWrapper'
import type { PpcServiceResultWrapper } from './PpcServiceResultWrapper'
export type EligibilityV2Dto = {
  crn: string
  cas1: Cas1ServiceResultWrapper
  cas2: Cas2ServiceResultWrapper
  cas3: Cas3ServiceResultWrapper
  dtr: DtrServiceResultWrapper
  crs: CrsServiceResultWrapper
  pa: PaServiceResultWrapper
  ppc: PpcServiceResultWrapper
}
