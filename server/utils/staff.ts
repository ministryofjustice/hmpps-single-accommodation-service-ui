import { AssignedToDto } from '@sas/api'

// eslint-disable-next-line import/prefer-default-export
export const staffName = (assignedTo: AssignedToDto, currentUsername?: string) => {
  const fullName = `${assignedTo.forename} ${assignedTo.surname}`
  return currentUsername && assignedTo?.username.toUpperCase() === currentUsername.toUpperCase()
    ? `You (${fullName})`
    : fullName
}
