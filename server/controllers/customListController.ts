import { Request, RequestHandler, Response } from 'express'
import AuditService, { Page } from '../services/auditService'
import CasesService from '../services/casesService'
import uiPaths from '../paths/ui'
import {
  assignedToOptions,
  casesResultsSummary,
  casesTableColumns,
  casesTabs,
  casesToRows,
  queryToFilters,
} from '../utils/cases'
import { addErrorToFlash, addUserInputToFlash, fetchErrorsAndUserInput } from '../utils/validation'
import {  setCaseListUrl } from '../utils/backlinks'
import { collectApiResponses } from '../utils/apiResponses'
import UserService from '../services/userService'
import { IndexRequest } from '@sas/ui'
import CustomListService from '../services/customListService'

export default class CustomListController {
  constructor(
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly customListService: CustomListService,
    private readonly userService: UserService,
  ) {}

  createList(): RequestHandler {
    return async (req: Request, res: Response) => {
      await this.auditService.logPageView(Page.CUSTOM_LIST_CREATE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
// using href here instead of hard coding makes it easier to change
      return res.render('pages/customList/createList', {
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
      const {  userInput } = fetchErrorsAndUserInput(req)
      return res.render('pages/customList/addCrns', { crnList:userInput.crnList })
    }
  }
  show(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token, username, displayName: userFullName } = res.locals.user
      await this.auditService.logPageView(Page.CUSTOM_LIST_SHOW, { who: username, correlationId: req.id })

      const { query } = req
      const { peopleType = 'NFA_RISK' } = query
      // this all could still be refactored with shared code.
      setCaseListUrl(req)

      const {
        data: { teams, cases },
      } = await collectApiResponses({
        teams: this.userService.getTeams(token),
        cases: this.customListService.getCustomList(token),
      })
      const filters = queryToFilters(query, req.originalUrl, teams)

      const currentUsername = query.teamCode ? username : undefined
      return res.render('pages/customList/show', {
        changeListHref: uiPaths.customList.addCrns.pattern,
        peopleType,
        tabs: casesTabs(req.originalUrl, peopleType),
        resultsSummary: casesResultsSummary(cases),
        casesTableColumns: casesTableColumns(),
        casesRows: casesToRows(cases, currentUsername),
        query,
        filters,
        assignedToOptions: assignedToOptions(userFullName, teams),
        riskLevelOptions: [
          { value: '', text: 'All' },
          { value: 'VERY_HIGH', text: 'Very high' },
          { value: 'HIGH', text: 'High' },
          { value: 'MEDIUM', text: 'Medium' },
          { value: 'LOW', text: 'Low' },
        ],
      })
    }
  }
  submitCrnList(): RequestHandler {
    return async (req: IndexRequest, res: Response) => {
      const { token } = res.locals.user
      addUserInputToFlash(req)
      const input: string[] = (req.body.crnList = req.body.crnList.length ? req.body.crnList.split(',') : [])
      try {
        await this.customListService.addCustomList(token, input)
        return res.render('pages/customList/confirmation', {
          crns: req.body.crnList.length,
          showHref: uiPaths.customList.show.pattern,
        })
      } catch (error) {
        addErrorToFlash(req, 'crnList',error.data.userMessage)
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
}
