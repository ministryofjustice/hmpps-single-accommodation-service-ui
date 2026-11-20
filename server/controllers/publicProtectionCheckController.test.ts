import { mock } from 'jest-mock-extended'
import { NextFunction, Request, Response } from 'express'
import { PublicProtectionFormData } from '@sas/ui'
import {
  checkYourAnswersRows,
  publicProtectionQuestionPages,
  PublicProtectionCheckPageName,
  publicProtectionCheckPageNames as pageNames,
} from '../utils/publicProtectionCheck'
import * as ppcUtils from '../utils/publicProtectionCheck'
import AuditService from '../services/auditService'
import CasesService from '../services/casesService'
import { apiResponseFactory, caseFactory } from '../testutils/factories'
import PublicProtectionCheckController from './publicProtectionCheckController'
import uiPaths from '../paths/ui'

const crn = 'C12345'
const forename = 'Giles'
const surname = 'Wembley-Hogg'
const personName = `${forename} ${surname}`
const caseData = caseFactory.build({ forename, surname, crn })

const auditService = mock<AuditService>()
const casesService = mock<CasesService>()

const casePath = uiPaths.cases.show({ crn })

describe('publicProtectionCheckController', () => {
  let request: Request
  let response: Response
  let controller: PublicProtectionCheckController
  const next = mock<NextFunction>()

  const setFormData = (data: Partial<PublicProtectionFormData>) => {
    request.session.multiPageFormData = {
      publicProtectionChecker: {
        [crn]: data,
      },
    }
  }

  beforeEach(() => {
    controller = new PublicProtectionCheckController(auditService, casesService)
    response = mock<Response>({ locals: { user: { userId: 'user-id', username: 'user1', token: 'token-1' } } })
    request = mock<Request>({
      id: 'request-id',
      params: { crn },
      session: {
        save: jest.fn().mockImplementation((callback: () => unknown) => callback()),
      },
    })

    casesService.getCase.mockResolvedValue(apiResponseFactory.case(caseData))
  })

  describe('start', () => {
    it('should initialise the form data', async () => {
      const data = { riskManagement: 'yes' }
      setFormData(data)

      await controller.start()(request, response, next)

      expect(request.session.multiPageFormData.publicProtectionChecker).toEqual({ [crn]: {} })
      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.publicProtectionCheck.questions({ crn, page: pageNames[0] }),
      )
    })
  })

  describe('questionShow', () => {
    it.each(pageNames)('the %s question page should redirect if no form data', async pageName => {
      await controller.questionShow(pageName)(request, response, next)

      expect(response.render).not.toHaveBeenCalled()
      expect(response.redirect).toHaveBeenCalledWith(casePath)
    })

    it.each(pageNames)('the %s question page should render if form data initialised', async pageName => {
      const data = { riskManagement: 'yes' }
      setFormData(data)

      await controller.questionShow(pageName)(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith('PUBLIC_PROTECTION_CHECK_QUESTION', {
        correlationId: 'request-id',
        who: 'user1',
        subjectId: 'C12345',
        subjectType: pageName,
      })

      const lastPage = pageNames[pageNames.indexOf(pageName) - 1]
      const backLinkHref = lastPage ? uiPaths.publicProtectionCheck.questions({ crn, page: lastPage }) : casePath

      expect(response.render).toHaveBeenCalledWith(
        'pages/public-protection-check/question',
        expect.objectContaining({ backLinkHref }),
      )

      const expectedPage = publicProtectionQuestionPages(personName, data)[pageName as PublicProtectionCheckPageName]
      const renderedPage = (response.render as jest.Mock).mock.calls[0][1].page

      expect(renderedPage.pageTitle).toEqual(expectedPage.pageTitle)
      expect(renderedPage.questions).toEqual(expectedPage.questions)
      expect(renderedPage.content).toEqual(expectedPage.content)
      expect(renderedPage.guidance).toEqual(expectedPage.guidance)
      expect(renderedPage).toEqual(expectedPage)
    })
  })

  describe('questionSave', () => {
    it('should redirect to the case page if there is no session data', async () => {
      await controller.questionSave('risk')(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(casePath)
    })

    it.each(pageNames)('should validate the response from the  %s page and should save the data', async pageName => {
      setFormData({})

      const body = {
        instructions: {},
        risk: { riskManagement: 'yes' },
        measures: { controlMeasures: 'yes' },
        'support-needs': { supportNeeds: 'yes' },
      }[pageName]

      request.body = body

      await controller.questionSave(pageName)(request, response, next)
      const nextPage = pageNames[pageNames.findIndex(name => name === pageName) + 1]
      const nextPath = nextPage
        ? uiPaths.publicProtectionCheck.questions({ crn, page: nextPage })
        : uiPaths.publicProtectionCheck.checkYourAnswers({ crn })

      expect(response.redirect).toHaveBeenCalledWith(nextPath)

      expect(request.session.multiPageFormData.publicProtectionChecker[crn]).toEqual(body)
    })
  })

  describe('checkYourAnswers', () => {
    it('should redirect back to the case page if there are no form data', async () => {
      await controller.checkYourAnswers()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(casePath)
    })

    it('should render the check your answers page', async () => {
      const formData = { riskManagement: 'yes', controlMeasures: 'no' }
      setFormData(formData)

      await controller.checkYourAnswers()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/public-protection-check/question',
        expect.objectContaining({
          pageTitle: 'Check your answers',
          tableRows: checkYourAnswersRows(caseData, formData),
        }),
      )
    })
  })

  describe('submit', () => {
    it('should redirect back to the case page if there are no form data', async () => {
      await controller.submit()(request, response, next)

      expect(response.redirect).toHaveBeenCalledWith(casePath)
    })

    it('should redirect to the relevant form if there is an error an any page', async () => {
      setFormData({})
      jest.spyOn(ppcUtils, 'validateBody').mockReturnValue({ question: 'fail message' })

      await controller.submit()(request, response, next)
      expect(response.redirect).toHaveBeenCalledWith(
        uiPaths.publicProtectionCheck.questions({ crn, page: pageNames[0] }),
      )
    })

    it('should redirect to the result page if there are no errors', async () => {
      setFormData({})
      jest.spyOn(ppcUtils, 'validateBody').mockReturnValue({})
      await controller.submit()(request, response, next)
      expect(response.redirect).toHaveBeenCalledWith(uiPaths.publicProtectionCheck.show({ crn }))
    })
  })

  describe('show', () => {
    it('should render the show page for an eligible case', async () => {
      const formData = { riskManagement: 'no', controlMeasures: 'yes', supportNeeds: 'no' }
      setFormData(formData)

      await controller.show()(request, response, next)

      expect(auditService.logPageView).toHaveBeenCalledWith('PUBLIC_PROTECTION_CHECK_SHOW', {
        correlationId: 'request-id',
        who: 'user1',
        subjectId: 'C12345',
      })
      expect(response.render).toHaveBeenCalledWith(
        'pages/public-protection-check/show',
        expect.objectContaining({
          casePageLink: casePath,
          eligible: true,
          pageTitle: 'Public protection need identified',
          personName,
        }),
      )
    })

    it('should render the show page for an ineligible case', async () => {
      const formData = { riskManagement: 'yes', controlMeasures: 'yes', supportNeeds: 'no' }
      setFormData(formData)

      await controller.show()(request, response, next)

      expect(response.render).toHaveBeenCalledWith(
        'pages/public-protection-check/show',
        expect.objectContaining({
          eligible: false,
          pageTitle: 'No public protection need identified',
        }),
      )
    })
  })
})
