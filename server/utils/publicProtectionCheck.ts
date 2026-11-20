import { Link, PublicProtectionFormData, RadioItem, StatusCard } from '@sas/ui'
import { SummaryListRow } from '@govuk/ui'
import { CaseDto } from '@sas/api'
import uiPaths from '../paths/ui'
import { summaryListRow } from './summaryListRow'
import { displayName } from './cases'

export const ppcLinksForStatus = (crn: string): Link[] => {
  const status = 'NOT_STARTED'

  switch (status) {
    case 'NOT_STARTED':
      return [{ text: 'Start checks', href: uiPaths.publicProtectionCheck.start({ crn }) }]
    default:
      return []
  }
}

export const publicProtectionCheckCard = (crn: string): StatusCard => ({
  heading: 'Public protection check',
  links: ppcLinksForStatus(crn),
})

type YesNo = 'yes' | 'no'

export const yesNo = (value?: YesNo): Array<RadioItem> => [
  { text: 'Yes', value: 'yes', checked: value === 'yes' },
  { text: 'No', value: 'no', checked: value === 'no' },
]

export type Question = {
  name: keyof PublicProtectionFormData
  label: string
  items: RadioItem[]
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
    pageTitle: 'Risk to others and self on release',
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
        name: 'riskManagement',
        label: `Could ${personName}'s risks be managed safely through stable accommodation and control measures?`,
        items: yesNo(data.riskManagement as YesNo),
        required: 'Choose an answer',
      },
    ],
  },
  measures: {
    pageTitle: 'Control measures',
    content:
      '<p class="govuk-body">Stable accommodation, combined with appropriate controls might be enough to safely manage risks in the community</p>',
    guidance:
      '<p>This can be things like:</p>' +
      '<ul class="govuk-list govuk-list--bullet">' +
      '<li>accommodation with external CCTV coverage and monitoring</li>' +
      '<li>drug or alcohol testing</li>' +
      '</ul>',
    questions: [
      {
        name: 'controlMeasures',
        label: `Does ${personName} require on-site supervision and risk management on release?`,
        items: yesNo(data.controlMeasures as YesNo),
        required: 'Choose an answer',
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
        name: 'supportNeeds',
        label: `Would stable accommodation and practical suport be enough to meet ${personName}'s support needs?`,
        items: yesNo(data.supportNeeds as YesNo),
        required: 'Choose an answer',
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

export const checkYourAnswersRows = (caseData: CaseDto, formData: PublicProtectionFormData): SummaryListRow[] =>
  Object.entries(publicProtectionQuestionPages(displayName(caseData), formData))
    .map(([name, page]: [string, QuestionPage]) => {
      return (page.questions || []).map(question => {
        let value = formData[question.name as keyof PublicProtectionFormData]
        value = question.items?.find(({ value: itemValue }) => value === itemValue)?.text || value
        return summaryListRow(question.label, value, {
          actions: [
            { text: 'Change', href: uiPaths.publicProtectionCheck.questions({ crn: caseData.crn, page: name }) },
          ],
        })
      })
    })
    .flat()
