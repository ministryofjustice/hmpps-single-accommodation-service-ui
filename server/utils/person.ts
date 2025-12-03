// eslint-disable-next-line import/prefer-default-export
export const calculateAge = (dateOfBirth: string) => {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()

  const years = today.getFullYear() - birthDate.getFullYear()

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    return years - 1
  }

  return years
}
