import { CaseDto as Case } from '@sas/api'
import { calculateAge } from './person'

export const formatDate = (date?: string, format?: 'days' | 'age') => {
  if (!date || Number.isNaN(new Date(date).getTime())) return 'Invalid Date'

  if (format === 'age') return `${calculateAge(date)}`

  if (format === 'days') return `${Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 3600 * 24))}`

  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

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
