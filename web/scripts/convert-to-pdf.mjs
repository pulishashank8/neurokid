import { mdToPdf } from 'md-to-pdf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '..', '..', 'PROJECT_SUMMARY.md');
const outputPath = join(__dirname, '..', '..', 'PROJECT_SUMMARY.pdf');

console.log('Converting PROJECT_SUMMARY.md to PDF...');

try {
  const pdf = await mdToPdf(
    { path: inputPath },
    {
      dest: outputPath,
      pdf_options: {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      },
      stylesheet: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 100%;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #1d4ed8;
          margin-top: 30px;
        }
        h3 {
          color: #1e40af;
        }
        code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Consolas', 'Monaco', monospace;
        }
        pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        blockquote {
          border-left: 4px solid #2563eb;
          padding-left: 15px;
          margin: 20px 0;
          color: #6b7280;
        }
      `,
    }
  );

  if (pdf) {
    console.log('✓ PDF created successfully!');
    console.log(`📄 Output: ${outputPath}`);
  }
} catch (error) {
  console.error('✗ Error converting to PDF:', error);
  process.exit(1);
}
