import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BillRow } from '@/lib/bill-utils';
import { CATEGORY_LABELS, type BillCategory } from '@/types/finance';

interface ReportOptions {
  bills: BillRow[];
  userName: string;
  formatCurrency: (v: number) => string;
  formatDate: (d: string) => string;
}

export function generateReportPDF({ bills, userName, formatCurrency, formatDate }: ReportOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Header ──
  doc.setFillColor(99, 102, 241); // primary indigo
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('JáPaguei', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Financeiro Geral', 14, 24);
  doc.text(`Gerado em ${dateStr}`, 14, 30);
  doc.text(userName, pageW - 14, 24, { align: 'right' });

  // ── Summary cards ──
  const pending = bills.filter(b => b.status === 'pendente');
  const paid = bills.filter(b => b.status === 'pago');
  const overdue = pending.filter(b => b.due_date && new Date(b.due_date) < now);
  const totalPending = pending.reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = paid.reduce((s, b) => s + Number(b.amount), 0);
  const totalOverdue = overdue.reduce((s, b) => s + Number(b.amount), 0);
  const totalGeral = totalPending + totalPaid;

  let y = 48;

  const drawCard = (x: number, w: number, label: string, value: string, color: [number, number, number]) => {
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(x, y, w, 22, 3, 3, 'F');
    doc.setTextColor(...color);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 4, y + 10);
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 4, y + 17);
  };

  const cardW = (pageW - 28 - 12) / 4;
  drawCard(14, cardW, 'Total Geral', formatCurrency(totalGeral), [30, 30, 60]);
  drawCard(14 + cardW + 4, cardW, 'Total Pendente', formatCurrency(totalPending), [220, 160, 30]);
  drawCard(14 + (cardW + 4) * 2, cardW, 'Total Pago', formatCurrency(totalPaid), [34, 160, 90]);
  drawCard(14 + (cardW + 4) * 3, cardW, 'Atrasado', formatCurrency(totalOverdue), [220, 50, 50]);

  y += 30;

  // ── Category breakdown ──
  doc.setTextColor(40, 40, 60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo por Categoria', 14, y);
  y += 6;

  const catMap = new Map<string, { total: number; count: number; pending: number; paid: number }>();
  bills.forEach(b => {
    const cat = b.category;
    if (!catMap.has(cat)) catMap.set(cat, { total: 0, count: 0, pending: 0, paid: 0 });
    const entry = catMap.get(cat)!;
    const amt = Number(b.amount);
    entry.total += amt;
    entry.count++;
    if (b.status === 'pago') entry.paid += amt;
    else entry.pending += amt;
  });

  const catRows = Array.from(catMap.entries()).sort((a, b) => b[1].total - a[1].total).map(([cat, v]) => [
    CATEGORY_LABELS[cat as BillCategory] || cat,
    String(v.count),
    formatCurrency(v.pending),
    formatCurrency(v.paid),
    formatCurrency(v.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Categoria', 'Qtd', 'Pendente', 'Pago', 'Total']],
    body: catRows,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Overdue bills ──
  if (overdue.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(220, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`⚠ Contas Atrasadas (${overdue.length})`, 14, y);
    y += 6;

    const overdueRows = overdue
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .map(b => {
        const daysLate = Math.floor((now.getTime() - new Date(b.due_date!).getTime()) / 86400000);
        return [
          b.description,
          CATEGORY_LABELS[b.category as BillCategory] || b.category,
          formatCurrency(Number(b.amount)),
          formatDate(b.due_date!),
          `${daysLate} dia(s)`,
        ];
      });

    autoTable(doc, {
      startY: y,
      head: [['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Atraso']],
      body: overdueRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 50, 50], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 3 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── All bills table ──
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setTextColor(40, 40, 60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Todas as Contas (${bills.length})`, 14, y);
  y += 6;

  const allRows = [...bills]
    .sort((a, b) => {
      const da = a.due_date || a.created_at;
      const db = b.due_date || b.created_at;
      return new Date(db).getTime() - new Date(da).getTime();
    })
    .map(b => [
      b.description,
      CATEGORY_LABELS[b.category as BillCategory] || b.category,
      formatCurrency(Number(b.amount)),
      b.due_date ? formatDate(b.due_date) : '—',
      b.status === 'pago' ? 'Pago' : 'Pendente',
      b.recurrence === 'mensal' ? 'Mensal' : b.recurrence === 'anual' ? 'Anual' : 'Única',
    ]);

  autoTable(doc, {
    startY: y,
    head: [['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status', 'Recorrência']],
    body: allRows,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [40, 40, 60] },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 50 },
      4: { fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = data.cell.raw === 'Pago' ? [34, 160, 90] : [220, 160, 30];
      }
    },
  });

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(245, 245, 250);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(140, 140, 160);
    doc.setFontSize(7);
    doc.text(`JáPaguei — Relatório gerado em ${dateStr}`, 14, pageH - 5);
    doc.text(`Página ${i} de ${totalPages}`, pageW - 14, pageH - 5, { align: 'right' });
  }

  doc.save(`relatorio-japaguei-${now.toISOString().slice(0, 10)}.pdf`);
}
