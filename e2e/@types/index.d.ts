declare module '@sas/e2e' {
  type UserLoginDetails = {
    username: string
    password: string
  }

  type UserType = 'probation'

  type TestOptions = {
    users: Record<UserType, UserLoginDetails>
  }
}
