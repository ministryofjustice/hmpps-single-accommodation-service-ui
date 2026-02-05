const isValidDate = (date?: string) => date && !Number.isNaN(new Date(date).getTime())

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

export const formatDate = (
  date?: string,
  format?: 'age' | 'long' | 'days' | 'days for/in' | 'days ago/in' | 'days for/left',
): string => {
  if (!isValidDate(date)) return 'Invalid Date'

  if (format === 'age') return `${calculateAge(date)}`

  if (format?.startsWith('days')) {
    const days = Math.ceil((new Date(date.substring(0, 10)).getTime() - Date.now()) / (1000 * 3600 * 24))
    const daysLabel = Math.abs(days) === 1 ? 'day' : 'days'

    if (days === 0 && format !== 'days') return 'today'
    if (days < 0) {
      if (format.includes('for')) return `for ${Math.abs(days)} ${daysLabel}`
      if (format.includes('ago')) return `${Math.abs(days)} ${daysLabel} ago`
    }
    if (days > 0) {
      if (format.includes('left')) return `${days} ${daysLabel} left`
      if (format.includes('in')) return `in ${days} ${daysLabel}`
    }

    return days.toString()
  }

  return new Date(date)
    .toLocaleDateString('en-GB', {
      weekday: format === 'long' ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(',', '')
}

export const formatDateAndDaysAgo = (date?: string): string => {
  if (!isValidDate(date)) return 'Invalid Date'

  return `${formatDate(date)} (${formatDate(date, 'days ago/in')})`
}
