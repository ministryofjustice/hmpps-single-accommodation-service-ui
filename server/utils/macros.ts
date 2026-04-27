import { StatusCard, StatusTag } from '@sas/ui'
import { CaseDto } from '@sas/api'
import { nunjucksInline } from './nunjucksSetup'

type Macro =
  | 'statusTag'
  | 'statusCell'
  | 'riskLevelTag'
  | 'statusCard'
  | 'referralHistoryTable'
  | 'accommodationHistoryTable'
  | 'personCell'
  | 'accommodationCard'
  | 'linksCell'
  | 'accommodationCell'
  | 'timelineDutyToRefer'
  | 'timelineProposedAddress'
  | 'actionsCell'

export const renderMacro = <T>(macroName: Macro, context: T): string =>
  nunjucksInline().renderString(
    `{%- from "components/macros/${macroName}.njk" import ${macroName} -%} {{ ${macroName}(context) }}`,
    { context },
  )

export const statusTag = (status: StatusTag, noWrap?: boolean) => renderMacro('statusTag', { ...status, noWrap })

export const statusCell = (context: { status: StatusTag; date?: string }) => renderMacro('statusCell', context)

export const riskLevelTag = (riskLevel: CaseDto['riskLevel']) => renderMacro('riskLevelTag', riskLevel)

export const statusCard = (cardData: StatusCard) => renderMacro('statusCard', cardData)
