import { CheckboxItem, Link, PublicProtectionFormData, RadioItem, StatusCard } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { CaseDto, PpcServiceResult, ServiceResult } from '@sas/api'
import uiPaths from '../paths/ui'
import { summaryListRow } from './summaryListRow'
import { checkboxItems, radioItems } from './utils'
import { serviceStatusTag } from './statusTag'

export const ppcLinksForStatus = (crn: string, status: ServiceResult['serviceStatus']): Link[] => {
  return status === 'PPC_NOT_STARTED'
    ? [{ text: 'Start checks', href: uiPaths.publicProtectionCheck.start({ crn }) }]
    : []
}

export const publicProtectionCheckStatusCard = (
  crn: string,
  { serviceResult: { serviceStatus } }: PpcServiceResult,
): StatusCard => {
  const detailsMap: Record<string, string> = {
    PPC_NOT_STARTED: 'Check public protection needs before you continue to a CAS application.',
    PPC_COMPLETED_PUBLIC_PROTECTION_REQUIRED: 'This informs suitability for Approved Premises (CAS1).',
    PPC_COMPLETED_PUBLIC_PROTECTION_NOT_REQUIRED: 'This informs suitability for Approved Premises (CAS1).',
  }
  return serviceStatus
    ? {
        heading: 'CAS applications',
        content: [{ text: detailsMap[serviceStatus] }],
        status: serviceStatusTag(serviceStatus),
        links: ppcLinksForStatus(crn, serviceStatus),
      }
    : undefined
}

type QuestionType = 'radio' | 'checkBox' | 'textInput' | 'textArea'

export type Question = {
  type: QuestionType
  name: keyof PublicProtectionFormData
  label: string
  hint?: string
  items?: (RadioItem | CheckboxItem)[]
  required?: string
}

export type QuestionPage = {
  pageTitle: string
  content?: string
  guidance?: string
  questions?: Question[]
}

export const publicProtectionCheckPageNames = ['instructions', 'risk', 'measures', 'support-needs'] as const

export type PublicProtectionCheckPageName = (typeof publicProtectionCheckPageNames)[number]

export const publicProtectionQuestionPages = (
  personName: string,
  data: PublicProtectionFormData,
): Record<PublicProtectionCheckPageName, QuestionPage> => ({
  instructions: {
    pageTitle: 'Check public protection needs',
    content:
      `<p class="govuk-body">Before starting any CAS referral, consider the level of public protection needed to manage the person's risks and needs.</p>` +
      '<p class="govuk-body">Your input should be based on:</p>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>risk to others and self on release</li>' +
      '<li>level of supervision and interventions needed</li>' +
      '<li>accommodation and support needs</li>' +
      '</ul>',
  },
  risk: {
    pageTitle: 'Public protection risk and needs',
    content:
      '<p class="govuk-body">Some people may pose significant risks to others or to themselves that require enhanced supervision and management,' +
      'especially directly following release.</p>',
    guidance:
      '<p>This can be things like:</p>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>Serious concerns about being managed safely in the community</li>' +
      '<li>able to live independently in shared accommodation</li>' +
      '</ul>',
    questions: [
      {
        type: 'radio',
        name: 'riskManagement',
        label: `Could ${personName}'s risks be managed safely through stable accommodation and control measures?`,
        items: radioItems({ yes: 'Yes', no: 'No' }, data.riskManagement),
        required: 'Choose an answer',
      },
    ],
  },
  measures: {
    pageTitle: 'Managing public protection risks and needs',
    content:
      '<p class="govuk-body">Thinking about the public protection risk that Tariq Garcia poses.</p>' +
      '<p class="govuk-body">Could stable accommodation, along with appropriate controls and support be enough to manage that risk in the community?</p>',
    guidance:
      '<p>This can be things like:</p>' +
      '<h2  class="govuk-heading-m">Control measures</h2>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>external CCTV coverage and monitoring arrangements</li>' +
      '<li>drug or alcohol testing as part of their licence agreement</li>' +
      '<li>electronic monitoring or curfews</li>' +
      '<li>licence conditions restricting behaviour, contact or movement</li>' +
      '<li>regular probation oversight and multi-agency support</li>' +
      '</ul>' +
      '<h2  class="govuk-heading-m">Support</h2>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>help accessing services and benefits</li>' +
      '<li>planning for long-term accommodation</li>' +
      '<li>practical resettlement support</li>' +
      '<li>regular property visits</li>' +
      '<li>regular support worker contact</li>' +
      '<li>support developing independent living skills</li>' +
      '</ul>',
    questions: [
      {
        type: 'checkBox',
        name: 'controlMeasures',
        label: `Which factors could manage ${personName}'s risks and needs in the community`,
        hint: 'Select all that apply',
        items: checkboxItems(
          {
            stableAccommodation: 'Stable accommodation',
            controlMeasures: 'Control measures in the community',
            practicalSupport: 'Practical support and guidance',
            none: {
              text: 'None of the above are enough',
              hint: { text: 'This person needs an enhanced level of supervision and risk management' },
            },
          },
          data.controlMeasures,
          { divider: 'Or' },
        ),
        required: 'Select one or more measures',
      },
    ],
  },
  'support-needs': {
    pageTitle: 'Support needs',
    content: `<p class="govuk-body">Stable accommodation and practical support may be enough to meet some people's needs</p>`,
    guidance:
      '<p>This can be things like:</p>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>help accessing services and benefits</li>' +
      '<li>planning for long-term accommodation</li>' +
      '<li>practical resettlement support</li>' +
      '<li>regular property visits</li>' +
      '<li>regular support worker contact</li>' +
      '<li>support developing independent living skills</li>' +
      '</ul>',
    questions: [
      {
        type: 'radio',
        name: 'supportNeeds',
        label: `Would stable accommodation and practical support be enough to meet ${personName}'s support needs?`,
        items: checkboxItems(
          {
            yes: 'Yes',
            no: { text: 'No', hint: { text: 'Risks can be appropriately managed through other control measures' } },
          },
          data.supportNeeds,
        ),
        required: 'Choose if needs can be met by accommodation and support',
      },
      {
        type: 'textArea',
        name: 'needsDetails',
        label: `Give further information`,
      },
    ],
  },
})

export const validateBody = (page: QuestionPage, body: PublicProtectionFormData) => {
  const errors: Record<string, string> = {}
  ;(page.questions || []).forEach((question: Question) => {
    if (question.required && !body[question.name]) {
      errors[question.name] = question.required
    }
  })
  return errors
}

export const checkYourAnswersRows = (
  pages: Record<string, QuestionPage>,
  caseData: CaseDto,
  formData: PublicProtectionFormData,
): SummaryListRow[] =>
  Object.entries(pages)
    .map(([name, page]: [string, QuestionPage]) => {
      return (page.questions || []).map(question => {
        const rawValue = formData[question.name as keyof PublicProtectionFormData]
        const textVal = (Array.isArray(rawValue) ? rawValue : [rawValue])
          .map(val => {
            const item = question.items?.find(({ value: itemValue }) => val === itemValue)
            return item?.text || item?.html || val
          })
          .join('\n')
        return summaryListRow(question.label, textVal || 'No answer given', {
          type: textVal && ['textArea', 'checkBox'].includes(question.type) ? 'textBlock' : 'text',
          actions: [
            { text: 'Change', href: uiPaths.publicProtectionCheck.questions({ crn: caseData.crn, page: name }) },
          ],
        })
      })
    })
    .flat()
