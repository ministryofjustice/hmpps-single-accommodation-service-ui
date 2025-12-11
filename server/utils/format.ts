import { CaseDto as Case, CasReferralStatus } from '@sas/api'

export const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export const formatRiskLevel = (level?: Case['riskLevel']) => {
  return (
    {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    }[level as NonNullable<typeof level>] || 'Unknown'
  )
}

export const formatStatus = (status: CasReferralStatus): string => {
  return status.charAt(0).toUpperCase() + status.toLowerCase().slice(1)
}
