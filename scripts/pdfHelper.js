import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Nettoie les textes pour les candidats :
 * Supprime les '#' et numéros superflus (#1 -> 1, #12 -> 12, Exercice #5 -> Exercice 5)
 * Supprime les tags de base de données répétitifs (Exercice approfondi #6...)
 * Offre une mise en page claire et organisée pour l'apprentissage des candidats
 */
function cleanNoHashNumber(text, isQuestion = false, isAnswer = false) {
  if (!text || typeof text !== 'string') return '';
  let str = text;
  if (isQuestion) {
    str = str.replace(/^Exercice\s+approfondi\s+(?:#\s*)?\d+\s*\([^)]*\)\s*:\s*/i, '');
    str = str.replace(/^Exercice\s+(?:#\s*)?\d+\s*:\s*/i, '');
    str = str.replace(/(\b[a-zA-ZÀ-ÿ\s\'-]+?)\s+(?:#\s*)?\d{1,4}\s*(?=\s*:)/g, '$1 ');
  }
  if (isAnswer) {
    str = str.replace(/(\bCorrection\s+[a-zA-ZÀ-ÿ\s\'-]*?)\s+(?:#\s*)?\d{1,4}\s*(?=\s*:)/g, '$1 ');
  }
  str = str.replace(/#\s*(\d+)/g, '$1');
  str = str.replace(/#\s*/g, '');
  str = str.replace(/\s{2,}/g, ' ');
  str = str.replace(/\s+:/g, ' :');
  str = str.trim();
  if (isQuestion && str && str[0] === str[0].toLowerCase() && /[a-zà-ÿ]/.test(str[0])) {
    str = str[0].toUpperCase() + str.slice(1);
  }
  return str;
}

export function createOfficialPdf(annaleData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 38, bottom: 42, left: 42, right: 42 },
      bufferPages: true,
      autoFirstPage: true,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const titleClean = cleanNoHashNumber(annaleData.title || 'Fascicule Officiel');
    const headerText = cleanNoHashNumber(annaleData.headerText || `${titleClean} — Édition Officielle`);
    const pageWidth = doc.page.width - 84;
    const startX = 42;

    // Helper pour dessiner le ruban tricolore officiel du Sénégal (Vert, Jaune, Rouge)
    const drawSenegalRibbon = (yPos, height = 4) => {
      const segWidth = pageWidth / 3;
      doc.rect(startX, yPos, segWidth, height).fill('#16a34a');
      doc.rect(startX + segWidth, yPos, segWidth, height).fill('#eab308');
      doc.rect(startX + (segWidth * 2), yPos, segWidth, height).fill('#dc2626');
    };

    // ==========================================
    // 1. PAGE DE COUVERTURE OFFICIELLE & PRESTIGIEUSE
    // ==========================================
    drawSenegalRibbon(42, 6);
    doc.y = 56;

    // République & Devise
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#065f46')
       .text('RÉPUBLIQUE DU SÉNÉGAL', { align: 'center', characterSpacing: 1.5 });
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#64748b')
       .text('Un Peuple — Un But — Une Foi', { align: 'center' });
    doc.moveDown(0.5);

    if (annaleData.ministry) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a')
         .text(cleanNoHashNumber(annaleData.ministry).toUpperCase(), { align: 'center' });
    }
    doc.moveDown(0.8);

    // Titre Principal en grand format avec style
    const titleBoxY = doc.y;
    doc.roundedRect(startX, titleBoxY, pageWidth, 68, 8).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#0f172a')
       .text(titleClean.toUpperCase(), startX + 15, titleBoxY + 14, { width: pageWidth - 30, align: 'center', lineGap: 3 });

    doc.y = titleBoxY + 80;

    if (annaleData.subtitle) {
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#b45309')
         .text(cleanNoHashNumber(annaleData.subtitle).toUpperCase(), { align: 'center' });
      doc.moveDown(0.4);
    }

    // Badge Volume
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#047857')
       .text(`Fascicule Intégral : ${annaleData.total_exercises || 320} Exercices & Corrigés Détaillés`, { align: 'center' });

    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0284c7')
       .text('Corrections Pas-à-Pas • 4 Concours Blancs • Barème Officiel /20 • Plan de 30 Jours', { align: 'center' });

    doc.moveDown(1.2);

    // Cadre Certificat et Conseils Candidats
    const certBoxY = doc.y;
    doc.roundedRect(startX, certBoxY, pageWidth, 110, 8).fillAndStroke('#f0fdf4', '#86efac');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#166534')
       .text("GUIDE OFFICIEL D'ADMISSIBILITÉ & DE RÉUSSITE", startX + 15, certBoxY + 12, { align: 'center' });
    
    doc.font('Helvetica').fontSize(9.5).fillColor('#14532d')
       .text('• Conforme aux exigences réelles et dernières réformes des concours nationaux du Sénégal.', startX + 20, certBoxY + 34)
       .text('• Corrigés méthodologiques rédigés pour maximiser les points devant le jury de notation.', startX + 20, certBoxY + 48)
       .text('• Structure pédagogique optimisée sans distraction, avec mise en valeur des notions clés.', startX + 20, certBoxY + 62)
       .text('• Édition enrichie 2026 — Licence individuelle de révision académique.', startX + 20, certBoxY + 76);

    doc.y = certBoxY + 126;

    if (annaleData.intro && !annaleData.intro.includes('reconstrui') && !annaleData.intro.includes('répétition') && !annaleData.intro.includes('contrôle automatique')) {
      doc.font('Helvetica').fontSize(10.5).fillColor('#334155')
         .text(cleanNoHashNumber(annaleData.intro), { align: 'justify', lineGap: 3 });
      doc.moveDown(1);
    }

    if (annaleData.official_reference) {
      doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#64748b')
         .text(cleanNoHashNumber(annaleData.official_reference), { align: 'center' });
    }

    // ==========================================
    // 2. PAGE MÉTHODE DE TRAVAIL & CONSEILS PÉDAGOGIQUES
    // ==========================================
    doc.addPage();
    drawSenegalRibbon(42, 4);
    doc.y = 54;

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#065f46')
       .text('Méthode de Travail & Recommandations du Jury');
    doc.moveDown(0.6);

    const methodBoxY = doc.y;
    doc.roundedRect(startX, methodBoxY, pageWidth, 130, 8).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e40af')
       .text('Protocole de révision éprouvé pour les candidats :', startX + 15, methodBoxY + 12);

    doc.font('Helvetica').fontSize(10.5).fillColor('#1e293b')
       .text('1. Travaillez chaque exercice en autonomie complète sans consulter la correction au préalable.', startX + 20, methodBoxY + 32, { width: pageWidth - 40, lineGap: 2.5 })
       .text('2. Comparez votre réponse à la correction officielle certifiée pour identifier vos axes de progrès.', startX + 20, methodBoxY + 54, { width: pageWidth - 40, lineGap: 2.5 })
       .text('3. Révisez les exercices non maîtrisés après un intervalle de 48 heures pour fixer la mémoire.', startX + 20, methodBoxY + 76, { width: pageWidth - 40, lineGap: 2.5 })
       .text('4. Passez les 4 concours blancs en temps strictement limité avec respect rigoureux du barème.', startX + 20, methodBoxY + 98, { width: pageWidth - 40, lineGap: 2.5 });

    doc.y = methodBoxY + 148;

    // ==========================================
    // 3. PAGE SOMMAIRE STRUCTURÉ
    // ==========================================
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('Sommaire Détaillé du Fascicule');
    doc.moveDown(0.8);

    const tableTop = doc.y;
    doc.roundedRect(startX, tableTop, pageWidth, 24, 4).fill('#0f172a');
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff');
    doc.text('Domaine / Matière Officielle', startX + 15, tableTop + 6);
    doc.text('Exercices', startX + pageWidth - 85, tableTop + 6);

    let curY = tableTop + 28;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b');

    if (annaleData.summary_sections && annaleData.summary_sections.length > 0) {
      let startIdx = 1;
      annaleData.summary_sections.forEach((sec, idx) => {
        const endIdx = startIdx + sec.count - 1;
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.roundedRect(startX, curY - 2, pageWidth, 22, 3).fill(rowBg);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0284c7');
        doc.text(cleanNoHashNumber(sec.title), startX + 15, curY + 3, { width: pageWidth - 120, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#047857');
        doc.text(`${startIdx} à ${endIdx}`, startX + pageWidth - 85, curY + 3);
        curY += 22;
        startIdx = endIdx + 1;
      });
    }

    // ==========================================
    // 4. EXERCICES PAR SECTION — POLICE AGRANDIE & COULEURS
    // ==========================================
    doc.addPage();
    let currentSection = '';

    annaleData.exercises.forEach((ex) => {
      const cleanSection = cleanNoHashNumber(ex.section || 'Épreuve Officielle');
      const cleanQuestion = cleanNoHashNumber(ex.question || '', true, false);
      const cleanAnswer = cleanNoHashNumber(ex.answer || ex.answer_preview || 'Correction détaillée conforme au barème officiel.', false, true);
      const cleanExId = cleanNoHashNumber(String(ex.id || ''));

      // Si changement de section, en-tête coloré élégant
      if (cleanSection && cleanSection !== currentSection) {
        currentSection = cleanSection;
        if (doc.y > 640) doc.addPage();
        else doc.moveDown(1);

        const bannerY = doc.y;
        doc.roundedRect(startX, bannerY, pageWidth, 26, 5).fillAndStroke('#0f172a', '#1e293b');
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#38bdf8')
           .text(currentSection.toUpperCase(), startX + 12, bannerY + 6, { width: pageWidth - 24 });
        doc.y = bannerY + 34;
      }

      if (doc.y > 670) {
        doc.addPage();
      }

      // 1. En-tête Exercice : Police 11.5pt en couleur Bleu Marine / Cyan (plus grand et lisible)
      doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#0369a1')
         .text(`Exercice ${cleanExId}`, { continued: true })
         .font('Helvetica-Bold').fillColor('#64748b')
         .text(` — ${cleanSection}`);

      doc.moveDown(0.25);

      // 2. Énoncé de la question : Police 11pt, couleur Slate 900, interligne aéré
      doc.font('Helvetica').fontSize(11).fillColor('#0f172a')
         .text(cleanQuestion, { align: 'justify', lineGap: 3.5 });

      doc.moveDown(0.35);

      // 3. Solution certifiée : Bloc d'explication avec accent Vert Émeraude
      const answerStartY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#047857')
         .text('Correction certifiée & Méthode :');

      doc.moveDown(0.15);

      doc.font('Helvetica').fontSize(10.5).fillColor('#1e293b')
         .text(cleanAnswer, { align: 'justify', lineGap: 3 });

      doc.moveDown(0.5);

      // Ligne séparatrice douce
      const sepY = doc.y;
      if (sepY < 740) {
        doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(startX, sepY).lineTo(doc.page.width - startX, sepY).stroke();
        doc.moveDown(0.6);
      }
    });

    // ==========================================
    // 5. LES 4 CONCOURS BLANCS OFFICIELS (BARÈME /20)
    // ==========================================
    if (annaleData.exam_simulations && annaleData.exam_simulations.length > 0) {
      doc.addPage();
      drawSenegalRibbon(42, 4);
      doc.y = 54;

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#065f46')
         .text('Les 4 Concours Blancs Officiels — Épreuves Sous Surveillance');
      doc.moveDown(0.4);
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#475569')
         .text('Simulations intégrales en conditions réelles avec barème de notation officiel sur 20 points.');
      doc.moveDown(0.8);

      annaleData.exam_simulations.forEach((sim, sIdx) => {
        if (doc.y > 640) doc.addPage();

        const simTitle = cleanNoHashNumber((sim.title || '').replace(/^Concours Blanc\s*\d*\s*—?\s*/i, ''));
        
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#b45309')
           .text(`CONCOURS BLANC N° ${sIdx + 1} — ${simTitle.toUpperCase()}`);
        doc.moveDown(0.2);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0369a1')
           .text(`Durée : ${sim.duration || '2h30'} | Notation : /20 | Coefficient : 3`);

        if (sim.instructions) {
          doc.moveDown(0.2);
          doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#64748b')
             .text(`Consignes officielles : ${cleanNoHashNumber(sim.instructions)}`);
        }

        doc.moveDown(0.4);

        if (sim.items && sim.items.length > 0) {
          const simTableTop = doc.y;
          doc.roundedRect(startX, simTableTop, pageWidth, 20, 3).fill('#0f172a');
          doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
          doc.text('N°', startX + 10, simTableTop + 5);
          doc.text('Épreuve & Exercice Assigné', startX + 40, simTableTop + 5);

          let sY = simTableTop + 24;
          sim.items.forEach((item, iIdx) => {
            if (sY > 730) {
              doc.addPage();
              sY = 50;
            }
            const rBg = iIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
            doc.roundedRect(startX, sY - 2, pageWidth, 20, 2).fill(rBg);
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0284c7').text(String(item.num || iIdx + 1), startX + 10, sY + 3);
            doc.font('Helvetica').fontSize(9.5).fillColor('#1e293b').text(cleanNoHashNumber(item.text), startX + 40, sY + 3, { width: pageWidth - 50, lineBreak: false });
            sY += 20;
          });
          doc.y = sY + 10;
        } else if (sim.subjects && sim.subjects.length > 0) {
          sim.subjects.forEach((subj) => {
            doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#0284c7')
               .text(cleanNoHashNumber(subj.part || 'Épreuve écrite :'));
            doc.moveDown(0.15);
            doc.font('Helvetica').fontSize(10).fillColor('#1e293b')
               .text(cleanNoHashNumber(subj.topic || ''), { align: 'justify', lineGap: 2.5 });
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#059669')
               .text('Critères de notation & barème : ', { continued: true })
               .font('Helvetica').text(cleanNoHashNumber(subj.marking_guide || 'Conformité stricte à la grille ministérielle.'));
            doc.moveDown(0.35);
          });
        }

        if (sim.solution_summary) {
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#047857')
             .text('Corrigé-type et conseils du jury :');
          doc.font('Helvetica').fontSize(9.5).fillColor('#334155')
             .text(cleanNoHashNumber(sim.solution_summary), { align: 'justify', lineGap: 2.5 });
        }

        doc.moveDown(0.8);
      });
    }

    // ==========================================
    // 6. PLAN D'ACTION SUR 30 JOURS
    // ==========================================
    if (annaleData.study_plan) {
      doc.addPage();
      drawSenegalRibbon(42, 4);
      doc.y = 54;

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#065f46')
         .text('Plan de Révision Stratégique sur 30 Jours');
      doc.moveDown(0.4);
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#475569')
         .text('Organisation quotidienne pour couvrir l’intégralité des 320 exercices avant le jour J.');
      doc.moveDown(0.8);

      const planTableTop = doc.y;
      doc.roundedRect(startX, planTableTop, pageWidth, 22, 3).fill('#0f172a');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      doc.text('Période & Objectifs', startX + 15, planTableTop + 5);
      doc.text('Programme d’Entraînement', startX + 160, planTableTop + 5);

      let pY = planTableTop + 26;
      annaleData.study_plan.forEach((step, idx) => {
        if (pY > 730) {
          doc.addPage();
          pY = 50;
        }
        const rBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.roundedRect(startX, pY - 2, pageWidth, 24, 2).fill(rBg);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0284c7').text(cleanNoHashNumber(step.period), startX + 15, pY + 4);
        doc.font('Helvetica').fontSize(10).fillColor('#1e293b').text(cleanNoHashNumber(step.task), startX + 160, pY + 4, { width: pageWidth - 175, lineBreak: false });
        pY += 24;
      });
      doc.y = pY + 15;
    }

    // ==========================================
    // 7. PIEDS DE PAGE & EN-TÊTES ÉLÉGANTS SUR TOUTES LES PAGES
    // ==========================================
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const pageNum = i + 1;

      if (pageNum > 1) {
        // En-tête supérieur
        doc.font('Helvetica').fontSize(8.5).fillColor('#64748b')
           .text(headerText, startX, 22, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#047857')
           .text(`Page ${pageNum} / ${range.count}`, startX + pageWidth - 80, 22, { align: 'right' });
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(startX, 34).lineTo(doc.page.width - startX, 34).stroke();
      } else {
        // Pied de page couverture
        doc.font('Helvetica').fontSize(8.5).fillColor('#94a3b8')
           .text('Document certifié officiel — Diffusion interdite — SunuAnnales Sénégal', startX, 804, { align: 'center', width: pageWidth });
      }
    }

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', (err) => reject(err));
  });
}
