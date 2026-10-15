import { Request, RequestHandler, Response } from 'express'
import { IndexRequest } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import { setupCaseList } from '../utils/cases'
import { addUserInputToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import { collectApiResponses } from '../utils/apiResponses'
import UserService from '../services/userService'
import CustomListService from '../services/customListService'

export default class CustomListController {
  constructor(
    private readonly auditService: AuditService,
    private readonly customListService: CustomListService,
    private readonly userService: UserService,
  ) {}

  customList(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, username, displayName: userFullName } = res.locals.user
      const eventDetails = { who: username, correlationId: req.id }
      const {
        data: { teams, cases },
      } = await collectApiResponses({
        teams: this.userService.getTeams(token),
        cases: this.customListService.getCustomList(token),
      })
      if (cases.length === 0) {
        await this.auditService.logPageView(Page.CUSTOM_LIST_INDEX, eventDetails)
        return res.render('pages/customList/index', {
          addCrnsHref: uiPaths.customList.addCrns.pattern,
        })
      }
      req.body = { crnList: cases.map(c => c.crn).join(',') }
      addUserInputToFlash(req)
      await this.auditService.logPageView(Page.CUSTOM_LIST_SHOW, eventDetails)
      return res.render('pages/customList/show', {
        changeListHref: uiPaths.customList.addCrns.pattern,
        ...setupCaseList(req, teams, username, cases, userFullName),
      })
    }
  }
  addCrns(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CUSTOM_LIST_ADD_CRNS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const {  userInput } = fetchErrorsAndUserInput(req)
      return res.render('pages/customList/addCrns', {
        crnList: userInput.crnList,
        backLinkHref: uiPaths.customList.index.pattern,
      })
    }
  }

  submitCrnList(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token } = res.locals.user
      const crnList = req.body?.crnList?.length ? req.body.crnList.split(',') : []
      try {
        await this.customListService.addCustomList(token, crnList)
        const crnTotalText = crnList.length
        const crnAddedText = crnTotalText > 1 ? 'CRNs added' : 'CRN added'
        return res.render('pages/customList/confirmation', {
          crnTotalText: crnTotalText,
          crnAddedText: crnAddedText,
          showHref: uiPaths.customList.index.pattern,
        })
      } catch (error) {
        const errorMessage = error.data?.developerMessage ? error.data.developerMessage : error.message
        return res.render('pages/customList/addCrns', {
          crnList,
          backLinkHref: uiPaths.customList.index.pattern,
          errorSummary: [{ text: errorMessage, href: '#crnList' }],
          errorMessage: {text: errorMessage}
        })
      }
    }
  }
}
