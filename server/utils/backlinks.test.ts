import { mock } from 'jest-mock-extended'
import { Session } from 'express-session'
import { Request } from 'express'
import * as backlinksUtils from './backlinks'
import { getCaseListUrl, getPageBackLink, setCaseListUrl } from './backlinks'
import uiPaths from '../paths/ui'

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

  const matchingReferer = 'http://localhost:3000/pattern1/112233445566'
  const nonMatchingReferer = 'http://localhost:3000/pattern3/someParameter'
  const differentDomainMatchingReferer = 'https://example.com/pattern1/abc'
  const lastStoredReferer = '/stored/222333444555'

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('getPageBackLink', () => {
    beforeEach(() => {
      jest.spyOn(backlinksUtils, 'getCaseListUrl').mockReturnValue('/?teamCode=N34')
    })

    it('should return the referer path and save it in session if it matches a provided path', () => {
      const request = mockRequest(matchingReferer, undefined)
      const expected = '/pattern1/112233445566'
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual(expected)
      expect(request.session.pageReferers[pagePattern]).toEqual(expected)
    })

    it('should return any query parameters in the referer path', () => {
      const request = mockRequest(`${matchingReferer}?foo=qux`, undefined)
      const expected = '/pattern1/112233445566?foo=qux'
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual(expected)
      expect(request.session.pageReferers[pagePattern]).toEqual(expected)
    })

    it('should return a case list url if the referer path matches but is from a different domain', () => {
      const request = mockRequest(differentDomainMatchingReferer, undefined)
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual('/?teamCode=N34')
    })

    it('should return the stored referer if the current referer does not match a path', () => {
      const request = mockRequest(nonMatchingReferer, lastStoredReferer)
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual(lastStoredReferer)
    })

    it('should return a case list url if there is no stored referer and the current referer does not match a path', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session
      expect(getPageBackLink(pagePattern, request, matchList)).toEqual('/?teamCode=N34')
    })

    it('should return the provided default path if there is no stored referer and the current referer does not match a path', () => {
      const request = mockRequest(null, null)
      request.session = {} as Session
      expect(getPageBackLink(pagePattern, request, matchList, 'defaultPath')).toEqual('defaultPath')
    })
  })

  describe('getCaseListUrl', () => {
    it('returns the base case list link if none is in session', () => {
      const request = mock<Request>()

      expect(getCaseListUrl(request)).toEqual(uiPaths.cases.index({}))
    })

    it('returns the case list link saved in session', () => {
      const request = mock<Request>({
        session: {
          caseListUrl: '/?foo=bar&qux=0',
        },
      })

      expect(getCaseListUrl(request)).toEqual('/?foo=bar&qux=0')
    })
  })

  describe('setCaseListUrl', () => {
    it('sets the given case list link in session', () => {
      const request = mock<Request>({
        query: {
          teamCode: 'YES',
          a: 'b',
        },
      })

      setCaseListUrl(request)

      expect(request.session.caseListUrl).toEqual('/?teamCode=YES&a=b')
    })
  })
})
