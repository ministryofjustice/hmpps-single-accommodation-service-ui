import { Request, RequestHandler, Response } from 'express'
import MultiPageFormManager from '../utils/multiPageFormManager'
import uiPaths from '../paths/ui'
import AuditService, { Page } from '../services/auditService'
import { fetchErrorsAndUserInput, validateAndFlashErrors } from '../utils/validation'
import CasesService from '../services/casesService'
import { displayName } from '../utils/cases'
import {
  publicProtectionQuestionPages,
  checkYourAnswersRows,
  validateBody,
  PublicProtectionCheckPageName as PageName,
  publicProtectionCheckPageNames as pageNames,
  QuestionPage,
  PublicProtectionCheckPageName,
} from '../utils/publicProtectionCheck'

export default class PublicProtectionCheckController {
  formData: MultiPageFormManager<'publicProtectionChecker'>

  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
  ) {
    this.formData = new MultiPageFormManager('publicProtectionChecker')
  }

  start(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      await this.formData.remove(crn, req.session)
      await this.formData.update(crn, req.session, {})
      return res.redirect(uiPaths.publicProtectionCheck.questions({ crn, page: pageNames[0] }))
    }
  }

  questionShow(pageName: string): RequestHandler {
    return async (req: Request, res: Response) => {
      const { token } = res.locals.user
      const { crn } = req.params

      await this.auditService.logPageView(Page.PUBLIC_PROTECTION_CHECK_QUESTION, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectId: crn,
        subjectType: pageName,
      })

      const { data: caseData } = await this.casesService.getCase(token, crn)

      const data = this.formData.get(crn, req.session)
      if (!data) return res.redirect(uiPaths.cases.show({ crn }))

      const { errors, errorSummary } = fetchErrorsAndUserInput(req)

      const page = publicProtectionQuestionPages(displayName(caseData), data)[pageName as PageName]

      const lastPage = pageNames[pageNames.indexOf(pageName as PageName) - 1]
      const backLinkHref = lastPage
        ? uiPaths.publicProtectionCheck.questions({ crn, page: lastPage })
        : uiPaths.cases.show({ crn })

      return res.render('pages/public-protection-check/question', {
        page,
        backLinkHref,
        submitButtonText: 'Continue',
        errors,
        errorSummary,
      })
    }
  }

  questionSave(pageName: string): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { body } = req

      const thisPath = uiPaths.publicProtectionCheck.questions({ crn, page: pageName })
      const data = this.formData.get(crn, req.session)
      if (!data) return res.redirect(uiPaths.cases.show({ crn }))

      const page = publicProtectionQuestionPages('', body)[pageName as PageName]

      if (!validateAndFlashErrors(req, validateBody(page, body))) return res.redirect(thisPath)

      await this.formData.update(crn, req.session, { ...data, ...body })
      const nextPage = pageNames[pageNames.indexOf(pageName as PageName) + 1]

      return res.redirect(
        nextPage
          ? uiPaths.publicProtectionCheck.questions({ crn, page: nextPage })
          : uiPaths.publicProtectionCheck.checkYourAnswers({ crn }),
      )
    }
  }

  checkYourAnswers(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.PUBLIC_PROTECTION_CHECK_CHECK_YOUR_ANSWERS, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectId: crn,
      })

      const data = this.formData.get(crn, req.session)
      if (!data) return res.redirect(uiPaths.cases.show({ crn }))

      const backLinkHref = uiPaths.publicProtectionCheck.questions({ crn, page: pageNames[pageNames.length - 1] })

      const { data: caseData } = await this.casesService.getCase(token, crn)

      return res.render('pages/public-protection-check/question', {
        backLinkHref,
        pageTitle: 'Check your answers',
        submitButtonText: 'Submit',
        tableRows: checkYourAnswersRows(caseData, data),
      })
    }
  }

  submit(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params

      const data = this.formData.get(crn, req.session)
      if (!data) return res.redirect(uiPaths.cases.show({ crn }))

      const pages = publicProtectionQuestionPages('', data)
      for (const pageName of Object.keys(pages)) {
        const page = pages[pageName as PublicProtectionCheckPageName] as QuestionPage
        if (!validateAndFlashErrors(req, validateBody(page, data)))
          return res.redirect(uiPaths.publicProtectionCheck.questions({ crn, page: pageName }))
      }

      return res.redirect(uiPaths.publicProtectionCheck.show({ crn }))
    }
  }

  show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { crn } = req.params
      const { token } = res.locals.user

      await this.auditService.logPageView(Page.PUBLIC_PROTECTION_CHECK_SHOW, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectId: crn,
      })

      const { data: caseData } = await this.casesService.getCase(token, crn)
      /** placeholder
       * these data should be pulled from the API by crn, along with the eligibility
       */
      const { riskManagement, controlMeasures, supportNeeds } = this.formData.get(crn, req.session) || {}

      const eligible = riskManagement === 'no' && controlMeasures === 'yes' && supportNeeds === 'no'

      return res.render('pages/public-protection-check/show', {
        eligible,
        surveyLink: '#',
        casePageLink: uiPaths.cases.show({ crn }),
        personName: displayName(caseData),
        pageTitle: eligible ? 'Public protection need identified' : 'No public protection need identified',
      })
    }
  }
}
