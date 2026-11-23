/* =====================================================================
   Génération de PDF téléchargeables (charte MCE Academy)
   - leçons, mémos, missions, quiz, rapport de profil, attestation
   jsPDF est chargé à la demande pour ne pas alourdir l'application.
   ===================================================================== */

const NAVY = '#112842';
const BRAND = '#2B9FDC';
const GOLD = '#C9A227';
const SLATE = '#475569';
const LIGHT = '#F1F5F9';
const FOOTER = 'MCE Academy — Ensemble vers la réussite';

/** Les polices standard des PDF ne gèrent que l'alphabet latin : on remplace le reste */
export function clean(s) {
  return String(s ?? '')
    .replace(/[’‘‛′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[—–‒]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•●▪◦]/g, '-')
    .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
    .replace(/≠/g, '!=').replace(/→/g, '->').replace(/✓|✔/g, 'v')
    .replace(/[   ]/g, ' ')
    .replace(/[^\x00-\xFF]/gu, '')
    .replace(/[ \t]+/g, ' ');
}
const stripMd = (s) => clean(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').trim();
export const slug = (s) => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

class PdfBuilder {
  constructor(jsPDF, { orientation = 'portrait' } = {}) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', orientation });
    this.W = this.doc.internal.pageSize.getWidth();
    this.H = this.doc.internal.pageSize.getHeight();
    this.M = 18;
    this.y = this.M;
    this.cw = this.W - this.M * 2;
  }

  font(size, style = 'normal', color = NAVY) {
    this.doc.setFont('helvetica', style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
    return size * 0.3528 * 1.4; // hauteur de ligne en mm
  }
  ensure(h) {
    if (this.y + h > this.H - 20) {
      this.doc.addPage();
      this.y = this.M + 4;
    }
  }
  space(h = 3) {
    this.y += h;
    return this;
  }

  /** Bandeau d'en-tête */
  header({ eyebrow, title, subtitle, color = BRAND }) {
    const d = this.doc;
    d.setFillColor(NAVY);
    d.rect(0, 0, this.W, 46, 'F');
    d.setFillColor(color);
    d.rect(0, 46, this.W, 1.6, 'F');
    this.font(8, 'bold', '#9CC9E8');
    d.text(clean(`MCE ACADEMY${eyebrow ? `  ·  ${eyebrow}` : ''}`).toUpperCase(), this.M, 13);
    const lh = this.font(19, 'bold', '#FFFFFF');
    const lines = d.splitTextToSize(clean(title), this.cw).slice(0, 2);
    d.text(lines, this.M, 24);
    if (subtitle) {
      this.font(10, 'normal', '#C7D7E8');
      d.text(d.splitTextToSize(clean(subtitle), this.cw).slice(0, 1), this.M, 24 + lines.length * lh + 1);
    }
    this.y = 58;
    return this;
  }

  h1(t) { return this.heading(t, 15, 6); }
  h2(t) { return this.heading(t, 12.5, 4.5); }
  h3(t) { return this.heading(t, 11, 3.5); }
  heading(t, size, before) {
    this.y += before;
    const lh = this.font(size, 'bold', NAVY);
    const lines = this.doc.splitTextToSize(stripMd(t), this.cw);
    this.ensure(lines.length * lh + 6);
    this.doc.text(lines, this.M, this.y);
    this.y += lines.length * lh;
    return this;
  }

  p(t, { size = 10, color = SLATE, style = 'normal', indent = 0 } = {}) {
    const lh = this.font(size, style, color);
    const lines = this.doc.splitTextToSize(stripMd(t), this.cw - indent);
    lines.forEach((l) => {
      this.ensure(lh);
      this.doc.text(l, this.M + indent, this.y);
      this.y += lh;
    });
    this.y += 1.5;
    return this;
  }

  bullets(items, { numbered = false } = {}) {
    items.forEach((it, i) => {
      const lh = this.font(10, 'normal', SLATE);
      const lines = this.doc.splitTextToSize(stripMd(it), this.cw - 7);
      this.ensure(lh * Math.min(lines.length, 2));
      this.font(10, 'bold', BRAND);
      this.doc.text(numbered ? `${i + 1}.` : '-', this.M + 1, this.y);
      this.font(10, 'normal', SLATE);
      lines.forEach((l) => {
        this.ensure(lh);
        this.doc.text(l, this.M + 7, this.y);
        this.y += lh;
      });
      this.y += 0.8;
    });
    this.y += 1;
    return this;
  }

  /** Encadré coloré */
  callout(t, { color = BRAND, title, bg = LIGHT } = {}) {
    const d = this.doc;
    const lh = this.font(10, 'normal', NAVY);
    const lines = d.splitTextToSize(stripMd(t), this.cw - 12);
    const th = title ? 5.5 : 0;
    const h = lines.length * lh + th + 6;
    this.ensure(h + 2);
    d.setFillColor(bg);
    d.rect(this.M, this.y - 4, this.cw, h, 'F');
    d.setFillColor(color);
    d.rect(this.M, this.y - 4, 1.4, h, 'F');
    let yy = this.y + 0.5;
    if (title) {
      this.font(8.5, 'bold', color);
      d.text(clean(title).toUpperCase(), this.M + 6, yy);
      yy += th;
    }
    this.font(10, 'normal', NAVY);
    d.text(lines, this.M + 6, yy);
    this.y += h + 2;
    return this;
  }

  table(rows) {
    if (!rows.length) return this;
    const d = this.doc;
    const cols = Math.max(...rows.map((r) => r.length));
    const colW = this.cw / cols;
    rows.forEach((r, ri) => {
      const head = ri === 0;
      const lh = this.font(9, head ? 'bold' : 'normal', head ? '#FFFFFF' : NAVY);
      const cells = r.map((c) => d.splitTextToSize(stripMd(c), colW - 4));
      const h = Math.max(...cells.map((c) => c.length)) * lh + 3.5;
      this.ensure(h);
      if (head) d.setFillColor(NAVY);
      else d.setFillColor(ri % 2 ? '#FFFFFF' : LIGHT);
      d.rect(this.M, this.y - 4, this.cw, h, 'F');
      cells.forEach((c, ci) => {
        this.font(9, head || ci === 0 ? 'bold' : 'normal', head ? '#FFFFFF' : NAVY);
        d.text(c, this.M + ci * colW + 2, this.y);
      });
      this.y += h;
    });
    this.y += 3;
    return this;
  }

  /** Barre de score (0-100) */
  scoreBar(label, value, color = BRAND, note) {
    const d = this.doc;
    this.ensure(10);
    this.font(9.5, 'bold', NAVY);
    d.text(clean(label), this.M, this.y);
    this.font(9.5, 'bold', color);
    d.text(`${Math.round(value)}/100`, this.M + this.cw, this.y, { align: 'right' });
    const by = this.y + 1.8;
    d.setFillColor('#E2E8F0');
    d.roundedRect(this.M, by, this.cw, 2.6, 1.3, 1.3, 'F');
    d.setFillColor(color);
    d.roundedRect(this.M, by, Math.max(2.6, (this.cw * Math.min(100, value)) / 100), 2.6, 1.3, 1.3, 'F');
    this.y = by + 6.5;
    if (note) this.p(note, { size: 8.5, color: '#64748B' });
    return this;
  }

  /** Conversion simple d'un contenu Markdown (titres, listes, tableaux, citations) */
  markdown(md) {
    const lines = String(md || '').replace(/\r/g, '').split('\n');
    let para = [];
    let list = null;
    let table = [];
    const flush = () => {
      if (para.length) this.p(para.join(' '));
      para = [];
      if (list) this.bullets(list.items, { numbered: list.numbered });
      list = null;
      if (table.length) this.table(table);
      table = [];
    };
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) { flush(); continue; }
      if (l.startsWith('|')) {
        if (para.length || list) { const t = table; table = []; flush(); table = t; }
        if (/^\|[\s:|-]+\|$/.test(l)) continue;
        table.push(l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        continue;
      }
      if (table.length) flush();
      let m;
      if ((m = l.match(/^(#{1,3})\s+(.*)/))) { flush(); this[['h1', 'h2', 'h3'][m[1].length - 1]](m[2]); continue; }
      if ((m = l.match(/^>\s?(.*)/))) { flush(); this.callout(m[1]); continue; }
      if ((m = l.match(/^[-*]\s+(.*)/))) {
        if (para.length) { this.p(para.join(' ')); para = []; }
        if (!list || list.numbered) { if (list) this.bullets(list.items, { numbered: true }); list = { numbered: false, items: [] }; }
        list.items.push(m[1]);
        continue;
      }
      if ((m = l.match(/^\d+\.\s+(.*)/))) {
        if (para.length) { this.p(para.join(' ')); para = []; }
        if (!list || !list.numbered) { if (list) this.bullets(list.items); list = { numbered: true, items: [] }; }
        list.items.push(m[1]);
        continue;
      }
      if (list) { this.bullets(list.items, { numbered: list.numbered }); list = null; }
      para.push(l);
    }
    flush();
    return this;
  }

  footer() {
    const d = this.doc;
    const n = d.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      d.setDrawColor('#E2E8F0');
      d.line(this.M, this.H - 13, this.W - this.M, this.H - 13);
      this.font(7.5, 'normal', '#94A3B8');
      d.text(FOOTER, this.M, this.H - 8.5);
      d.text(`${i} / ${n}`, this.W - this.M, this.H - 8.5, { align: 'right' });
    }
    return this;
  }

  save(name) {
    this.footer();
    this.doc.save(`${slug(name) || 'document'}.pdf`);
  }
}

async function builder(opts) {
  const { jsPDF } = await import('jspdf');
  return new PdfBuilder(jsPDF, opts);
}

/* ---------------------------------------------------------------------
   Documents prêts à l'emploi
   --------------------------------------------------------------------- */

/** Fiche d'une leçon ou d'une mission (contenu Markdown) */
export async function downloadLessonPdf({ lesson, moduleTitle, courseTitle, kind = 'Leçon' }) {
  const b = await builder();
  b.header({ eyebrow: `${kind} · ${moduleTitle || ''}`, title: lesson.title, subtitle: courseTitle });
  b.markdown(lesson.content);
  if (lesson.type === 'exercise') {
    b.h2('Ma réponse');
    for (let i = 0; i < 9; i++) {
      b.ensure(9);
      b.doc.setDrawColor('#CBD5E1');
      b.doc.line(b.M, b.y + 4, b.M + b.cw, b.y + 4);
      b.y += 9;
    }
  }
  b.save(`${kind}_${lesson.title}`);
}

/** Quiz imprimable (sans les réponses) */
export async function downloadQuizPdf({ lesson, questions, moduleTitle, courseTitle }) {
  const b = await builder();
  b.header({ eyebrow: `Quiz · ${moduleTitle || ''}`, title: lesson.title, subtitle: courseTitle, color: GOLD });
  if (lesson.content) b.callout(lesson.content, { color: GOLD, title: 'Consigne' });
  b.p(`${questions.length} questions · cochez la bonne réponse, puis validez vos choix dans la plateforme pour obtenir la correction.`, { size: 9, color: '#64748B' });
  questions.forEach((q, i) => {
    b.ensure(12 + q.options.length * 6);
    b.h3(`${i + 1}. ${q.question}`);
    b.y += 1.5;
    q.options.forEach((o, k) => {
      const lh = b.font(10, 'normal', SLATE);
      const lines = b.doc.splitTextToSize(clean(o), b.cw - 12);
      b.ensure(lines.length * lh);
      b.doc.setDrawColor('#94A3B8');
      b.doc.rect(b.M + 2, b.y - 3, 3.2, 3.2);
      b.font(10, 'bold', NAVY);
      b.doc.text('ABCDE'[k], b.M + 7.5, b.y);
      b.font(10, 'normal', SLATE);
      b.doc.text(lines, b.M + 12, b.y);
      b.y += lines.length * lh + 1;
    });
  });
  b.save(`Quiz_${lesson.title}`);
}

/** Mémo C.L.E.F. */
export async function downloadMemoPdf(memo, themeName) {
  const b = await builder();
  b.header({ eyebrow: `Mémo ${memo.id} · ${memo.tag}`, title: memo.titre, subtitle: `${themeName} · ${memo.audience}`, color: '#F97316' });
  b.callout(memo.mantra, { color: '#F97316', bg: '#FFF7ED' });
  b.h2('À retenir');
  b.bullets(memo.points);
  b.callout(memo.cas, { title: 'Exemple concret (fictif)' });
  b.callout(memo.question, { title: 'Question à se poser', color: '#6366F1' });
  b.callout(memo.action, { title: 'À tester demain', color: '#0D9488', bg: '#F0FDFA' });
  b.save(`Memo_${memo.id}_${memo.titre}`);
}

/** Rapport de profil professionnel */
export async function downloadProfilPdf({ run, name, comment, model }) {
  const { DIM, DIM_COLORS, AXES, PM, bandOf, profilType, portrait, narrative, workWithTips, axisText, gaps } = model;
  const r = run.result;
  const ty = profilType(run);
  const b = await builder();
  b.header({ eyebrow: 'Rapport de profil professionnel', title: name, subtitle: `Passation du ${new Date(run.date).toLocaleDateString('fr-FR')} · ${run.minutes} min${run.timed_out ? ' · temps écoulé' : ''}` });

  // Indice global
  b.ensure(30);
  const d = b.doc;
  d.setFillColor(LIGHT);
  d.roundedRect(b.M, b.y - 4, b.cw, 26, 3, 3, 'F');
  b.font(30, 'bold', BRAND);
  d.text(String(r.global_score), b.M + 8, b.y + 13);
  b.font(9, 'normal', '#64748B');
  d.text('/100 · indice global', b.M + 8, b.y + 19);
  b.font(13, 'bold', NAVY);
  d.text(clean(`${ty.main.nom}`), b.M + 55, b.y + 5);
  b.font(9.5, 'normal', SLATE);
  d.text(d.splitTextToSize(clean(`${ty.main.court}. Tendance secondaire : ${ty.second.nom}.`), b.cw - 62), b.M + 55, b.y + 11);
  if (r.reliability) {
    b.font(8.5, 'bold', '#64748B');
    d.text(clean(`Fiabilité des réponses : ${r.reliability.level} (${r.reliability.coherence}/100)`), b.M + 55, b.y + 19);
  }
  b.y += 28;

  b.h2('Portrait');
  b.p(portrait(run, name));
  if (r.objective?.text) b.callout(`« ${r.objective.text} »`, { title: 'Objectif personnel', color: '#10B981' });

  b.h2('Compétences mesurées');
  r.dimensions.forEach((x) => b.scoreBar(DIM[x.id].title, x.score, DIM_COLORS[x.id], bandOf(x.score).label));

  b.h2('Forces et priorités');
  b.bullets(r.strengths.map((id) => `Force — ${DIM[id].title} (${r.dimensions.find((x) => x.id === id).score}/100) : ${DIM[id].high}`));
  b.bullets(r.priorities.map((id) => `Priorité — ${DIM[id].title} : ${DIM[id].action30}`));

  const gp = gaps(run);
  if (gp.length) {
    b.h2('Points à vérifier en situation');
    gp.forEach((g) => b.callout(g.text, { title: g.title, color: '#F59E0B', bg: '#FFFBEB' }));
  }

  if (r.axes) {
    b.h2('Style de fonctionnement');
    b.table([['Axe', 'Tendance'], ...AXES.map((a) => [`${a.a} / ${a.b}`, axisText(a.id, r.axes[a.id])])]);
  }

  b.h2('Lecture personnalisée');
  narrative(run).forEach((n) => { b.h3(n.t); b.p(n.b); });

  b.h2('Comment travailler avec cette personne');
  b.bullets(workWithTips(run), { numbered: true });

  b.h2('Plan d’action à 30 jours');
  b.bullets(r.priorities.slice(0, 2).map((id) => `${DIM[id].short} : ${DIM[id].action30}`));

  if (comment) b.callout(comment, { title: 'Observation du formateur', color: '#6366F1' });
  b.p(PM.notice, { size: 8, color: '#94A3B8' });
  b.save(`Rapport_profil_${name}`);
}

/** Attestation de formation (paysage) */
export async function downloadAttestationPdf({ name, courseTitle, company, completedAt, hours, certId }) {
  const b = await builder({ orientation: 'landscape' });
  const d = b.doc;
  const { W, H } = b;
  d.setFillColor(NAVY);
  d.rect(0, 0, W, H, 'F');
  d.setFillColor('#FFFFFF');
  d.roundedRect(10, 10, W - 20, H - 20, 4, 4, 'F');
  d.setDrawColor(GOLD);
  d.setLineWidth(0.8);
  d.roundedRect(15, 15, W - 30, H - 30, 3, 3);
  b.font(10, 'bold', BRAND);
  d.text('MCE ACADEMY', W / 2, 34, { align: 'center' });
  b.font(30, 'bold', NAVY);
  d.text('ATTESTATION DE FORMATION', W / 2, 52, { align: 'center' });
  b.font(12, 'normal', SLATE);
  d.text('MCE Academy atteste que', W / 2, 70, { align: 'center' });
  b.font(26, 'bold', NAVY);
  d.text(clean(name), W / 2, 86, { align: 'center' });
  d.setDrawColor(GOLD);
  d.line(W / 2 - 50, 91, W / 2 + 50, 91);
  b.font(12, 'normal', SLATE);
  d.text('a suivi avec succès le programme', W / 2, 104, { align: 'center' });
  b.font(16, 'bold', NAVY);
  d.text(d.splitTextToSize(clean(courseTitle), W - 80), W / 2, 116, { align: 'center' });
  b.font(10.5, 'normal', SLATE);
  const meta = [company && `Entreprise : ${company}`, hours && `Durée : ${hours}`, completedAt && `Achevé le ${new Date(completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`].filter(Boolean).join('   ·   ');
  d.text(clean(meta), W / 2, 134, { align: 'center' });
  b.font(9, 'italic', '#64748B');
  d.text("Se découvrir. S'exprimer. Agir. Progresser.", W / 2, 160, { align: 'center' });
  b.font(8, 'normal', '#94A3B8');
  d.text(clean(`N° ${certId} — ${FOOTER}`), W / 2, H - 22, { align: 'center' });
  d.save(`${slug(`Attestation_MCE_${name}`)}.pdf`);
}
