import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function generatePDF(elementId, filename = 'resume.pdf') {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Resume element not found')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * (imgWidth / pdfWidth * pdfWidth)

  const imgScaledWidth = pdfWidth
  const imgScaledHeight = (imgHeight * pdfWidth) / imgWidth

  let heightLeft = imgScaledHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 0) {
    position = heightLeft - imgScaledHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(filename)
}
