/**
 * Resume Parser — extracts raw text from PDF and DOCX files.
 * Uses pdf-parse for PDF and mammoth for DOCX.
 */
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

async function parseResume(filePath, fileType) {
  try {
    if (fileType === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      try {
        const parser = new PDFParse({ data: dataBuffer });
        await parser.load();
        const textResult = await parser.getText();
        const textStr = typeof textResult === 'string' 
          ? textResult 
          : (textResult?.text || textResult?.pages?.map(p => p.text).join(' ') || '');

        if (textStr && textStr.trim().length > 0) {
          return textStr;
        }
      } catch (pdfErr) {
        console.warn('[PDF Parser] Warning:', pdfErr.message);
      }

      // Fallback: Extract printable text streams from binary buffer
      const bufferStr = dataBuffer.toString('utf-8');
      const printable = bufferStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
      if (printable && printable.trim().length > 20) {
        return printable;
      }
      return '';
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
    return '';
  } catch (err) {
    console.error('Resume parse error:', err.message);
    return '';
  }
}

module.exports = { parseResume };
