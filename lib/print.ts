export function printDocument(elementId: string, title: string = 'Dokument') {
  const printContent = document.getElementById(elementId);
  if (!printContent) return false;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => {
      if (el.tagName.toLowerCase() === 'link') {
        const href = el.getAttribute('href');
        if (href) {
          const absoluteHref = new URL(href, window.location.origin).href;
          return `<link rel="stylesheet" href="${absoluteHref}">`;
        }
      }
      return el.outerHTML;
    })
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <base href="${window.location.origin}">
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            color: black !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
          }
          #${elementId} {
            display: block !important;
            position: static !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            #${elementId} {
              visibility: visible !important;
              zoom: 0.86;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
        <script>
          window.onload = () => {
             // Oczekujemy chwilę zanim style z linków zewnętrznych zastaną pobrane
            setTimeout(() => {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  return true;
}
