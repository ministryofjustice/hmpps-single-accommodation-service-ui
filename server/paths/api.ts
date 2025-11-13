import { path } from 'static-path'

const apiRoot = path('/')

export default {
  cases: apiRoot.path('cases'),
}
