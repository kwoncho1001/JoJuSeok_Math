import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UsePdfGeneratorOptions {
    reportTitle: string;
}

export const usePdfGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePdf = useCallback(async (reportElement: HTMLElement, options: UsePdfGeneratorOptions) => {
        setIsGenerating(true);
        
        const originalCssText = reportElement.style.cssText;
        const originalClassList = Array.from(reportElement.classList);

        const style = document.createElement('style');
        style.innerHTML = `
            .capturing * {
                transition: none !important;
                animation: none !important;
                box-shadow: none !important;
                text-shadow: none !important;
            }
            .capturing .h-full {
                transition-property: none !important;
            }
            .capturing {
                width: 900px !important;
                min-width: 900px !important;
                background-color: white !important;
                line-height: 1.2 !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                position: relative !important;
                z-index: 9999 !important;
            }
            .capturing .truncate {
                overflow: visible !important;
                white-space: normal !important;
            }
            .capturing [data-pdf-section] {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 20px !important;
            }
            .capturing .latex-math {
                display: inline-block !important;
                font-family: 'KaTeX_Main', 'Inter', sans-serif !important;
            }
        `;
        document.head.appendChild(style);
        reportElement.classList.add('capturing');

        if (document.fonts) await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 12;
            const contentWidth = pageWidth - (margin * 2);
            
            const headerElement = reportElement.querySelector('[data-pdf-header]') as HTMLElement;
            let headerImgData = '';
            let headerHeight = 0;

            if (headerElement) {
                const headerCanvas = await html2canvas(headerElement, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    foreignObjectRendering: false,
                    logging: false,
                    fontEmbedCSS: true
                });
                headerImgData = headerCanvas.toDataURL('image/jpeg', 0.7);
                headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
            }

            const sections = Array.from(reportElement.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
            let currentY = margin;

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const canvas = await html2canvas(section, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    foreignObjectRendering: false,
                    logging: false,
                    fontEmbedCSS: true
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.7);
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

                if (currentY > margin && currentY + imgHeight > pdf.internal.pageSize.getHeight() - (margin + headerHeight + 10)) {
                    pdf.addPage();
                    currentY = margin;
                }

                if (currentY === margin && headerImgData) {
                    pdf.addImage(headerImgData, 'JPEG', margin, margin, contentWidth, headerHeight, undefined, 'MEDIUM');
                    currentY += headerHeight + 6;

                    const pageHeight = pdf.internal.pageSize.getHeight();
                    pdf.setDrawColor(79, 70, 229);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin);
                }

                pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, imgHeight, undefined, 'MEDIUM');
                currentY += imgHeight + 4;

                if ((section.id === 'section-page-1' || section.id === 'section-unit-summary') && i < sections.length - 1) {
                    pdf.addPage();
                    currentY = margin;
                }
            }

            pdf.save(`${options.reportTitle}.pdf`);
        } catch (error) {
            console.error("PDF 생성 중 치명적 오류:", error);
            throw error;
        } finally {
            reportElement.classList.remove('capturing');
            reportElement.classList.add(...originalClassList);
            reportElement.style.cssText = originalCssText;
            style.remove();
            setIsGenerating(false);
        }
    }, []);

    return { generatePdf, isGenerating };
};
