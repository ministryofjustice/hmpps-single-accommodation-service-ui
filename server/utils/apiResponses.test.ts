import { ApiResponse } from '@sas/ui'
import { collectApiResponses } from './apiResponses'

describe('apiResponses', () => {
  describe('collectApiResponses', () => {
    it('returns data and upstream failure keys for the given api calls collection configuration', async () => {
      const call1 = async (arg: string): Promise<ApiResponse> => Promise.resolve({ data: arg })
      const call2 = async (): Promise<ApiResponse> =>
        Promise.resolve({
          data: null,
          upstreamFailures: [
            {
              endpoint: 'someEndpoint',
              failureType: 'UNKNOWN_ERROR',
              message: 'Some message',
            },
          ],
        })

      const { data, upstreamFailures } = await collectApiResponses({
        call1Variable: call1('foo'),
        call2Variable: call2(),
      })

      expect(data).toEqual({ call1Variable: 'foo', call2Variable: null })
      expect(upstreamFailures).toEqual(['call2Variable'])
    })
  })
})
