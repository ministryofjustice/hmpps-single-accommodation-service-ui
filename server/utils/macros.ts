import { StatusCard, StatusTag } from '@sas/ui'
import { CaseDto } from '@sas/api'
import { nunjucksInline } from './nunjucksSetup'

type Macro =
  | 'statusTag'
  | 'riskLevelTag'
  | 'statusCard'
  | 'referralHistoryTable'
  | 'personCell'
  | 'accommodationCard'
  | 'linksCell'
  | 'accommodationCell'

export const renderMacro = <T>(macroName: Macro, context: T): string =>
  nunjucksInline().renderString(
    `{%- from "components/macros/${macroName}.njk" import ${macroName} -%} {{ ${macroName}(context) }}`,
    { context },
  )

export const statusTag = (context: StatusTag) => renderMacro('statusTag', context)

export const riskLevelTag = (context: CaseDto['riskLevel']) => renderMacro('riskLevelTag', context)

export const statusCard = (context: StatusCard) => renderMacro('statusCard', context)
