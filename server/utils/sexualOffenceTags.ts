import { CaseDto } from '@sas/api'

// eslint-disable-next-line import/prefer-default-export
export const sexualOffenceTags: Record<CaseDto['sexualOffenceRegistrations'][number], string> = {
  RSC: '(SC1 & SC2)',
  ANSO: 'Non Registered Sex Offender',
  ARSO: 'Registered Sex Offender',
  RCHD: 'Risk to Children',
  SHPO: 'Sexual Harm Prevention Order / Sexual Risk Order',
  CSEP: 'Child Sexual Exploitation – Perpetrator',
  ALT13: 'ALT Child Sexual Exploitation history',
  ALT3: 'ALT Registered Sex Offender',
  SOPS: 'Sex Offences Prevention Order',
}
