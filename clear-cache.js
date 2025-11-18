// Clear all gloop-related localStorage data
console.log('Clearing gloop cache...')
for (let key in localStorage) {
  if (key.startsWith('gloop-') || key === 'recent-gloops') {
    localStorage.removeItem(key)
    console.log('Removed:', key)
  }
}
console.log('Cache cleared! Refresh the page.')