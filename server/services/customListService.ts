import CustomListClient from '../data/customListClient'

export default class CustomListService {
  constructor(private readonly customListClient: CustomListClient) {}

  addCustomList(token: string, crnList: string[]) {
    return this.customListClient.addCustomList(token, crnList)
  }

  getCustomList(token: string) {
    return this.customListClient.getCustomList(token)
  }
}
