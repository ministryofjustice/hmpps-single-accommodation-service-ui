import { StatusCard, StatusTag } from '@sas/ui'
import { CaseDto } from '@sas/api'
import { TextOrHtmlContent } from '@govuk/ui'
import { nunjucksInline } from './nunjucksSetup'

type Macro =
  | 'statusTag'
  | 'statusCell'
  | 'riskLevelTag'
  | 'tierScoreTag'
  | 'statusCard'
  | 'referralHistoryTable'
  | 'accommodationHistoryTable'
  | 'personCell'
  | 'accommodationCard'
  | 'linksCell'
  | 'accommodationCell'
  | 'tableTextCell'
  | 'timelineDutyToRefer'
  | 'timelineProposedAddress'
  | 'actionsCell'
  | 'govukDetails'
  | 'textBlock'

export const renderMacro = <T>(macroName: Macro, context: T): string =>
  nunjucksInline().renderString(
    `{%- from "components/macros/${macroName}.njk" import ${macroName} -%} {{ ${macroName}(context) }}`,
    { context },
  )

export const statusTag = (status: StatusTag, classes?: string) => renderMacro('statusTag', { ...status, classes })

export const statusCell = (context: { status: StatusTag; dateText?: string; details?: Array<TextOrHtmlContent> }) =>
  renderMacro('statusCell', context)

export const riskLevelTag = (riskLevel: CaseDto['riskLevel']) => renderMacro('riskLevelTag', riskLevel)

export const tierScoreTag = (tierScore: CaseDto['tierScore']) => renderMacro('tierScoreTag', tierScore)

export const statusCard = (cardData: StatusCard) => renderMacro('statusCard', cardData)

export const govukDetails = (summaryText: string, text: string) => renderMacro('govukDetails', { summaryText, text })

export const textBlock = (text?: string) => renderMacro('textBlock', text)
