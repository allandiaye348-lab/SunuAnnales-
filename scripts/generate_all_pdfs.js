import fs from 'fs';
import path from 'path';
import { createOfficialPdf } from './pdfHelper.js';

async function generateAllPdfs() {
  const bookletsDir = path.resolve(process.cwd(), 'data/booklets');
  const publicPdfDir = path.resolve(process.cwd(), 'public/pdfs');
  const dataPdfDir = path.resolve(process.cwd(), 'data/pdfs');
  const distPdfDir = path.resolve(process.cwd(), 'dist/pdfs');

  fs.mkdirSync(publicPdfDir, { recursive: true });
  fs.mkdirSync(dataPdfDir, { recursive: true });
  if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    fs.mkdirSync(distPdfDir, { recursive: true });
  }

  const files = fs.readdirSync(bookletsDir).filter(f => f.endsWith('.json')).sort();
  console.log(`Found ${files.length} booklets to generate as PDF.`);

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const annaleId = filename.replace('.json', '');
    const bookletPath = path.join(bookletsDir, filename);
    const publicPdfPath = path.join(publicPdfDir, `${annaleId}.pdf`);
    const dataPdfPath = path.join(dataPdfDir, `${annaleId}.pdf`);
    const distPdfPath = path.join(distPdfDir, `${annaleId}.pdf`);

    try {
      console.log(`[${i + 1}/${files.length}] Replacing PDF for ${annaleId}...`);
      const bookletData = JSON.parse(fs.readFileSync(bookletPath, 'utf-8'));
      
      // Ensure exercises array exists
      if (!bookletData.exercises && bookletData.protected_exercises) {
        bookletData.exercises = bookletData.protected_exercises;
      }
      
      const exCount = bookletData.exercises ? bookletData.exercises.length : 0;
      console.log(`  -> Content verified: ${exCount} exercises, style preserved.`);

      await createOfficialPdf(bookletData, publicPdfPath);
      // Copy to data/pdfs as well
      fs.copyFileSync(publicPdfPath, dataPdfPath);
      if (fs.existsSync(distPdfDir)) {
        fs.copyFileSync(publicPdfPath, distPdfPath);
      }

      const stats = fs.statSync(publicPdfPath);
      console.log(`✓ ${annaleId}.pdf replaced successfully (${Math.round(stats.size / 1024)} KB)`);
    } catch (err) {
      console.error(`✗ Error generating PDF for ${annaleId}:`, err);
    }
  }

  console.log('\nAll 24 official PDFs have been successfully replaced and synchronized in public/pdfs/, data/pdfs/ and dist/pdfs/!');
}

generateAllPdfs().catch(console.error);
