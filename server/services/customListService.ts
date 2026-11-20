import { GetCasesApiQuery } from '@sas/ui'
import CustomListClient from '../data/customListClient'

export default class CustomListService {
  constructor(private readonly customListClient: CustomListClient) {}

  addCustomList = (token: string, crnList: string[]) => this.customListClient.addCustomList(token, crnList)

  getCustomListCrns = (token: string) => this.customListClient.getCustomListCrns(token)

  getCustomListCases = (token: string, query: GetCasesApiQuery) =>
    this.customListClient.getCustomListCases(token, query)
}
