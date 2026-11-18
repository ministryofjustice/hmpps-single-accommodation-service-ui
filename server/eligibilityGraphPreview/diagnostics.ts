/* eslint-disable no-console */
export const captureException = (error: Error) => console.error(error)

export default {
  error: (...args: unknown[]) => console.error(...args),
}
