import { CaseDto as Case } from '@sas/api'
import { StatusTag } from '@sas/ui'

// eslint-disable-next-line import/prefer-default-export
export const riskLevelStatusTag = (riskLevel: Case['riskLevel']): StatusTag =>
  ({
    LOW: { text: 'Low', colour: 'low' },
    MEDIUM: { text: 'Medium', colour: 'medium' },
    HIGH: { text: 'High', colour: 'high' },
    VERY_HIGH: { text: 'Very high', colour: 'very-high' },
  })[riskLevel] || { text: 'Unknown' }
