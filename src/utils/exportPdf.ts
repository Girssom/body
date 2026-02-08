import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportYearRecapAsPdf = async (elementId: string, year: number) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: '#020617',
    scale: window.devicePixelRatio || 2,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  const filename = `Grissom_Fitness_YearRecap_${year}.pdf`;
  pdf.save(filename);
};

export const exportYearRecapAsPng = async (elementId: string, year: number) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: '#020617',
    scale: window.devicePixelRatio || 2,
  });
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `Grissom_Fitness_YearRecap_${year}.png`;
  link.click();
};

