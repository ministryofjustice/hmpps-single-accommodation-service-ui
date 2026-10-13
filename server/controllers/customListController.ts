import { Request, RequestHandler, Response } from 'express'
import { IndexRequest } from '@sas/ui'
import AuditService, { Page } from '../services/auditService'
import uiPaths from '../paths/ui'
import { setupCaseList } from '../utils/cases'
import { addErrorToFlash, addUserInputToFlash, fetchErrorsAndUserInput } from '../utils/validation'
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
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CUSTOM_LIST_INDEX, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      return res.render('pages/customList/index', {
        addCrnsHref: uiPaths.customList.addCrns.pattern,
      })
    }
  }

  addCrns(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CUSTOM_LIST_ADD_CRNS, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)
      return res.render('pages/customList/addCrns', {
        crnList: userInput.crnList,
        errors,
        errorSummary,
      })
    }
  }

  submitCrnList(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token } = res.locals.user
      req.body.crnList = req.body.crnList.length ? req.body.crnList.split(',') : []
      addUserInputToFlash(req)
      try {
        await this.customListService.addCustomList(token, req.body.crnList)
        return res.render('pages/customList/confirmation', {
          crns: req.body.crnList.length,
          showHref: uiPaths.customList.show.pattern,
        })
      } catch (error) {
        const errorMessage = error.data.developerMessage ? error.data.developerMessage : error.message
        addErrorToFlash(req, 'crnList', errorMessage)
        const { errors, errorSummary, userInput } = fetchErrorsAndUserInput(req)
        return res.render('pages/customList/addCrns', {
          crnList: userInput.crnList,
          error: error.data.userMessage,
          errors,
          errorSummary,
        })
      }
    }
  }

  show(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, username, displayName: userFullName } = res.locals.user
      await this.auditService.logPageView(Page.CUSTOM_LIST_SHOW, { who: username, correlationId: req.id })

      const {
        data: { teams, cases },
      } = await collectApiResponses({
        teams: this.userService.getTeams(token),
        cases: this.customListService.getCustomList(token),
      })

      return res.render('pages/customList/show', {
        changeListHref: uiPaths.customList.addCrns.pattern,
        ...setupCaseList(req, teams, username, cases, userFullName),
      })
    }
  }
}
