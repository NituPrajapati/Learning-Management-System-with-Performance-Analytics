export function formatDateIST(input: string | number | Date): string {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
}

export function formatTimeIST(input: string | number | Date): string {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  })
}

