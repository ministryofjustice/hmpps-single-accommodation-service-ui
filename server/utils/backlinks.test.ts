import { mock } from 'jest-mock-extended'
import { Session } from 'express-session'
import { Request } from 'express'
import * as backlinksUtils from './backlinks'
import { getFlowRedirect, getPageBackLink, setFlowRedirect } from './backlinks'

describe('Link management', () => {
  const matchList = ['/pattern1/:param', '/pattern2/']
  const pagePattern = 'page-Pattern'

  const mockRequest = (referer: string, lastStoredReferer: string) =>
    mock<Request & { session: Session }>({
      headers: { referer },
      session: {
        pageReferers: {
          [pagePattern]: lastStoredReferer,
        },
      },
    })

  const matchingReferer = 'http://domain/pattern1/112233445566'
  const nonMatchingReferer = 'http://domain/pattern3/someParameter'
  const lastStoredReferer = 'http://last/stored/222333444555'

  describe('getPageBackLink', () => {
    it('should return the referer if it matches a provided path', () => {
      const request = mockRequest(matchingReferer, undefined)
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual(matchingReferer)
      expect(request.session.pageReferers[pagePattern]).toEqual(matchingReferer)
    })

    it('should return the stored referer if the current referer does not match a path', () => {
      const request = mockRequest(nonMatchingReferer, lastStoredReferer)
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual(lastStoredReferer)
    })

    it('should return a homepage link if there is no stored referer and the current referer does not match a path', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual('/')
    })

    it('should return the provided default path if there is no stored referer and the current referer does not match a path', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session
      expect(getPageBackLink(pagePattern, request, matchList, 'defaultPath')).toEqual('defaultPath')
    })
  })

  describe('setFlowRedirect', () => {
    it('should call getPageBackLink and return the result', () => {
      const request = mockRequest(null, '/last-stored-url')
      jest.spyOn(backlinksUtils, 'getPageBackLink')

      const redirect = setFlowRedirect(pagePattern, request, matchList)

      expect(backlinksUtils.getPageBackLink).toHaveBeenCalledWith(pagePattern, request, matchList, '/')
      expect(redirect).toEqual('/last-stored-url')
    })
  })

  describe('getFlowRedirect', () => {
    it('should return the stored referer for the given page pattern', () => {
      const storedUrl = '/cases/CRN123/dtr'
      const request = mockRequest(null, storedUrl)

      expect(getFlowRedirect(pagePattern, request)).toEqual(storedUrl)
    })

    it('should return the default path when no stored referer exists', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session

      expect(getFlowRedirect(pagePattern, request, 'defaultPath')).toEqual('defaultPath')
    })

    it('should return "/" when no stored referer exists and no default is provided', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session

      expect(getFlowRedirect(pagePattern, request)).toEqual('/')
    })
  })
})
