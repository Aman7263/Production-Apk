export function formatTime(dateString) {

  const date = new Date(dateString)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(dateString) {

  const date = new Date(dateString)

  return date.toLocaleDateString()
}