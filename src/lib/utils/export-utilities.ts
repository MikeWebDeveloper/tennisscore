export const exportToPDF = (data: any) => {
  // PDF export implementation
  return Promise.resolve(new Blob(['PDF data'], { type: 'application/pdf' }))
}

export const exportToCSV = (data: any[]) => {
  // CSV export implementation
  const csv = data.map(row => Object.values(row).join(',')).join('\n')
  return new Blob([csv], { type: 'text/csv' })
}

export const exportToJSON = (data: any) => {
  const json = JSON.stringify(data, null, 2)
  return new Blob([json], { type: 'application/json' })
}

export const exportUtilities = {
  exportToPDF,
  exportToCSV,
  exportToJSON
}

export default exportUtilities