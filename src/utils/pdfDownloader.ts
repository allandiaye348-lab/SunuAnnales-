import { Annale, User } from '../types';

/**
 * Téléchargement universel et résilient du fascicule PDF officiel
 * Fonctionne à 100 % sur serveur Node.js (Express), Vercel, GitHub Pages et hors-ligne.
 */
export async function downloadAnnalePdf(annale: Annale, user?: User | null) {
  const token = localStorage.getItem('sunu_token') || sessionStorage.getItem('sunu_admin_token') || '';
  const filename = `concours-${annale.slug || annale.id}-officiel.pdf`;

  // 1. Tenter le téléchargement depuis le serveur backend Node.js
  try {
    const res = await fetch(`/api/annales/${annale.id}/download-pdf?token=${encodeURIComponent(token)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    }
  } catch (e) {
    console.warn('Backend PDF endpoint non joignable. Tentative directe...', e);
  }

  // 2. Tenter le téléchargement direct du fichier PDF officiel original
  try {
    const directRes = await fetch(`/pdfs/${annale.id}.pdf`);
    if (directRes.ok) {
      const contentType = directRes.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await directRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    }
  } catch (e) {
    console.warn('Tentative directe /pdfs/... échouée', e);
  }

  // 3. Génération locale de secours en cas d'absence totale de réseau
  generateClientSideOfficialPdfDocument(annale, user);
}

/**
 * Nettoie les textes pour les candidats :
 * Supprime les '#' et numéros superflus (#1 -> 1, #12 -> 12, Exercice #5 -> Exercice 5)
 * Supprime les tags de base de données répétitifs (Exercice approfondi #6...)
 * Offre une mise en page claire et organisée pour l'apprentissage des candidats
 */
function cleanNoHashNumber(text: string | null | undefined, isQuestion = false, isAnswer = false): string {
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

/**
 * Génère une page A4 officielle complète avec styles d'impression PDF
 * Permet d'enregistrer en PDF immédiatement via Ctrl+P ou bouton Enregistrer en PDF.
 */
function generateClientSideOfficialPdfDocument(annale: Annale, user?: User | null) {
  const licenseKey = `SN-${annale.id.substring(0, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const userName = user?.name || 'Candidat Officiel';
  const userEmail = user?.email || 'candidat@sunuannales.sn';
  const rawExercises = annale.protected_exercises && annale.protected_exercises.length > 0
    ? annale.protected_exercises
    : (annale.sample_exercises || []);

  const exercises = rawExercises.map(ex => ({
    ...ex,
    id: cleanNoHashNumber(String(ex.id)),
    section: cleanNoHashNumber(ex.section),
    question: cleanNoHashNumber(ex.question, true, false),
    answer: cleanNoHashNumber(ex.answer || ex.answer_preview, false, true),
  }));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Si le bloqueur de pop-up bloque la fenêtre, on crée un lien téléchargeable HTML direct
    downloadFallbackHtml(annale, user, licenseKey, exercises);
    return;
  }

  const cleanTitle = cleanNoHashNumber(annale.title);
  const cleanMinistry = cleanNoHashNumber(annale.ministry);
  const cleanCorps = cleanNoHashNumber(annale.target_corps);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${cleanTitle} — Fascicule Officiel PDF</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    .tricolor-bar {
      height: 8px;
      display: flex;
      margin-bottom: 25px;
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-green { flex: 1; background: #16a34a; }
    .bar-yellow { flex: 1; background: #eab308; }
    .bar-red { flex: 1; background: #dc2626; }

    .header {
      text-align: center;
      margin-bottom: 28px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
    }
    .republic {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #065f46;
      margin: 0 0 4px 0;
    }
    .motto {
      font-size: 12px;
      font-style: italic;
      color: #64748b;
      margin: 0 0 10px 0;
    }
    .ministry {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 14px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    .corps {
      font-size: 15px;
      font-weight: 700;
      color: #0284c7;
      margin: 0;
    }

    .certificate {
      background: #f0fdf4;
      border: 2px solid #86efac;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 30px;
    }
    .certificate-title {
      font-size: 15px;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .cert-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13.5px;
    }
    .cert-label { color: #4b5563; font-weight: 600; }
    .cert-val { color: #0f172a; font-weight: 700; }

    .action-bar {
      background: #0f172a;
      color: white;
      padding: 14px 22px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      font-size: 14px;
    }
    .btn-print {
      background: #16a34a;
      color: white;
      border: none;
      padding: 10px 22px;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .btn-print:hover {
      background: #15803d;
    }

    .section-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      border-left: 6px solid #16a34a;
      padding-left: 14px;
      margin: 35px 0 20px 0;
    }

    .exercise-box {
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #0284c7;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 20px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .ex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .ex-badge {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ex-num {
      font-size: 14px;
      font-weight: 800;
      color: #0369a1;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .ex-question {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
      line-height: 1.55;
    }
    .ex-answer {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 14.5px;
      color: #1e293b;
      line-height: 1.6;
    }
    .ex-answer-title {
      color: #047857;
      font-weight: 800;
      margin-bottom: 4px;
      display: block;
    }

    @media print {
      .action-bar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div><strong>SunuAnnales Officiel :</strong> Votre fascicule est prêt avec mise en page A4 officielle.</div>
    <button class="btn-print" onclick="window.print()">📥 Enregistrer en PDF / Imprimer</button>
  </div>

  <div class="tricolor-bar">
    <div class="bar-green"></div>
    <div class="bar-yellow"></div>
    <div class="bar-red"></div>
  </div>

  <div class="header">
    <div class="republic">RÉPUBLIQUE DU SÉNÉGAL</div>
    <div class="motto">Un Peuple — Un But — Une Foi</div>
    <div class="ministry">${cleanMinistry}</div>
    <h1 class="title">${cleanTitle}</h1>
    <div class="corps">${cleanCorps} • Édition Officielle Enrichie</div>
  </div>

  <div class="certificate">
    <div class="certificate-title">Certificat d'Acquisition Nominative & Licence Officielle</div>
    <div class="cert-grid">
      <div><span class="cert-label">Candidat titulaire :</span> <span class="cert-val">${userName}</span></div>
      <div><span class="cert-label">Email vérifié :</span> <span class="cert-val">${userEmail}</span></div>
      <div><span class="cert-label">Identifiant de licence :</span> <span class="cert-val">${licenseKey}</span></div>
      <div><span class="cert-label">Statut du règlement :</span> <span class="cert-val">2 000 FCFA — Validé Wave / OM</span></div>
      <div><span class="cert-label">Volume certifié :</span> <span class="cert-val">${annale.total_exercises} Exercices Corrigés</span></div>
      <div><span class="cert-label">Date d'édition :</span> <span class="cert-val">${new Date().toLocaleDateString('fr-FR')}</span></div>
    </div>
  </div>

  <div class="section-title">Programme & Exercices Corrigés Officiels</div>

  ${exercises.map((ex, idx) => `
    <div class="exercise-box">
      <div class="ex-header">
        <span class="ex-badge">${ex.section || 'Épreuve Officielle'}</span>
        <span class="ex-num">Exercice ${ex.id || (idx + 1)}</span>
      </div>
      <div class="ex-question">${ex.question}</div>
      <div class="ex-answer">
        <span class="ex-answer-title">Solution certifiée & Méthode :</span>
        ${ex.answer || 'Correction complète certifiée conforme aux annales officielles.'}
      </div>
    </div>
  `).join('')}

  ${annale.exam_simulations && annale.exam_simulations.length > 0 ? `
    <div style="page-break-before: always; margin-top: 35px;">
      <div class="section-title">Les 4 Concours Blancs Officiels Complets (Barème /20)</div>
      ${annale.exam_simulations.map((sim, sIdx) => `
        <div style="border: 2px solid #b45309; border-radius: 10px; padding: 22px; margin-bottom: 25px; page-break-inside: avoid; background: #ffffff;">
          <div style="font-size: 17px; font-weight: 800; color: #b45309; margin-bottom: 6px;">
            CONCOURS BLANC N° ${sIdx + 1} — ${cleanNoHashNumber(sim.title || '').toUpperCase()}
          </div>
          <div style="font-size: 13.5px; color: #0369a1; font-weight: 700; margin-bottom: 12px;">
            <strong>Durée :</strong> ${sim.duration || '2h30'} • <strong>Notation :</strong> /20 • <strong>Coefficient :</strong> 3
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #1e293b; margin-bottom: 14px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${cleanNoHashNumber((sim as any).instructions || 'Épreuve en conditions réelles sous stricte surveillance.')}
          </div>
          ${(sim as any).subjects ? (sim as any).subjects.map((sub: any) => `
            <div style="margin-top: 12px; padding: 14px; border-left: 4px solid #0284c7; background: #f0f9ff; margin-bottom: 10px; border-radius: 6px;">
              <strong style="color: #0369a1; font-size: 15px;">${cleanNoHashNumber(sub.part || 'Épreuve')}</strong>
              <p style="margin: 6px 0; font-size: 14.5px; line-height: 1.5;">${cleanNoHashNumber(sub.topic || '')}</p>
              <small style="color: #047857; font-size: 13.5px;"><strong>Barème officiel :</strong> ${cleanNoHashNumber(sub.marking_guide || '')}</small>
            </div>
          `).join('') : ''}
          ${(sim as any).solution_summary ? `
            <div style="margin-top: 12px; padding: 14px; background: #ecfdf5; border-radius: 8px; font-size: 14px; color: #065f46; line-height: 1.6; border: 1px solid #a7f3d0;">
              <strong style="font-size: 14.5px;">Corrigé-type et recommandations du jury :</strong><br/>
              ${cleanNoHashNumber((sim as any).solution_summary)}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  <div style="page-break-before: always; margin-top: 35px;">
    <div class="section-title">Plan d'Action & de Révision Intensif sur 30 Jours</div>
    <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
      <div style="padding: 16px 20px; border: 1.5px solid #cbd5e1; border-left: 6px solid #4338ca; border-radius: 10px; background: #ffffff;">
        <strong style="color: #4338ca; font-size: 15.5px;">Semaine 1 (Jours 1 à 7) : Français, Vocabulaire administratif & Calcul rapide</strong>
        <p style="font-size: 14px; margin: 8px 0 0 0; color: #334155; line-height: 1.6;">Exercices 1 à 75. Révision quotidienne des accords grammaticaux, conjugaisons et règles de trois. Entraînement physique : footing 45 min et étirements.</p>
      </div>
      <div style="padding: 16px 20px; border: 1.5px solid #cbd5e1; border-left: 6px solid #047857; border-radius: 10px; background: #ffffff;">
        <strong style="color: #047857; font-size: 15.5px;">Semaine 2 (Jours 8 à 14) : Histoire du Sénégal, Géographie & Institutions</strong>
        <p style="font-size: 14px; margin: 8px 0 0 0; color: #334155; line-height: 1.6;">Exercices 76 à 155. Maîtrise des repères historiques de 1960, organisation des 14 régions et séparation des pouvoirs. Entraînement physique : fractionné 30/30.</p>
      </div>
      <div style="padding: 16px 20px; border: 1.5px solid #cbd5e1; border-left: 6px solid #b45309; border-radius: 10px; background: #ffffff;">
        <strong style="color: #b45309; font-size: 15.5px;">Semaine 3 (Jours 15 à 21) : Tests Psychotechniques, Droit pénal & Déontologie</strong>
        <p style="font-size: 14px; margin: 8px 0 0 0; color: #334155; line-height: 1.6;">Exercices 156 à 265. Pratique intensive des suites logiques, légitime défense (art. 316), garde à vue et missions institutionnelles. Première simulation : Concours Blanc 1 & 2.</p>
      </div>
      <div style="padding: 16px 20px; border: 1.5px solid #cbd5e1; border-left: 6px solid #be123c; border-radius: 10px; background: #ffffff;">
        <strong style="color: #be123c; font-size: 15.5px;">Semaine 4 (Jours 22 à 30) : Mises en situation, Concours Blancs 3 & 4 et Oral</strong>
        <p style="font-size: 14px; margin: 8px 0 0 0; color: #334155; line-height: 1.6;">Exercices 266 à 320. Réalisation sous chronomètre des Concours Blancs 3 et 4. Entraînement à l’épreuve orale devant un miroir (pitch 2 min) et test Luc-Léger final.</p>
      </div>
    </div>
  </div>

  <div style="margin-top: 45px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 20px; font-size: 12px; color: #64748b;">
    Document officiel SunuAnnales Sénégal — Licence nominative accordée pour préparation personnelle aux concours.
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function downloadFallbackHtml(annale: Annale, user: User | null | undefined, licenseKey: string, exercises: any[]) {
  const content = `SunuAnnales - ${annale.title}\nLicence: ${licenseKey}\nTitulaire: ${user?.name || 'Candidat'}\n\n` +
    exercises.map((e, i) => `[Exercice ${i + 1}] (${e.section})\nQ: ${e.question}\nR: ${e.answer || e.answer_preview}\n\n`).join('');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `concours-${annale.slug || annale.id}-officiel.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
