/**
 * Utility to reliably trigger print dialog across standalone windows and iframe sandboxes
 */
export function executePrint() {
  try {
    // 1. If not sandboxed inside an iframe, direct window.print() is preferred
    const isInIframe = window.self !== window.top;
    if (!isInIframe) {
      window.print();
      return true;
    }
  } catch {
    // Cross-origin iframe or permission issue
  }

  // 2. Try window.print() inside iframe first (some environments permit it)
  try {
    window.print();
  } catch (err) {
    console.warn('Direct window.print() blocked in iframe, opening dedicated print tab:', err);
  }

  // 3. Clone and open printable window
  openStandalonePrintWindow();
  return true;
}

export function openStandalonePrintWindow() {
  const printArea = document.getElementById('invoice-printable-area');
  if (!printArea) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('กรุณาอนุญาตป๊อปอัป (Allow Popups) หรือกดปุ่ม Ctrl+P เพื่อสั่งพิมพ์');
    return;
  }

  // Collect all styles from the current document
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

  const contentHtml = printArea.innerHTML;

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8" />
      <title>พิมพ์ใบกำกับภาษี / ใบเสร็จรับเงิน (ต้นฉบับ + สำเนา)</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
      ${styleTags}
      <style>
        body {
          background-color: #ffffff !important;
          color: #000000 !important;
          padding: 0 !important;
          margin: 0 !important;
          font-family: 'Sarabun', sans-serif !important;
        }
        .no-print {
          display: none !important;
        }
        .a4-page {
          page-break-after: always !important;
          break-after: page !important;
          min-height: 280mm !important;
          padding: 10mm 12mm !important;
          box-shadow: none !important;
          border: none !important;
        }
        .a4-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      </style>
    </head>
    <body>
      ${contentHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
