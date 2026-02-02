import jsPDF from 'jspdf';
import type { LocationData, StepStatus } from '@/features/autism-navigator/types/roadmap';
import type { RoadmapStep } from '@/features/autism-navigator/types/roadmap';
import { getOrderedStepsForAge, isStepRecommendedForAge } from '@/features/autism-navigator/data/ageStepLogic';

interface PDFGeneratorOptions {
  location: LocationData;
  steps: RoadmapStep[];
  getStepStatus: (stepId: number) => StepStatus;
  format: 'detailed' | 'quick';
}

const STATUS_LABELS: Record<StepStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_SYMBOLS: Record<StepStatus, string> = {
  not_started: '[ ]',
  in_progress: '[~]',
  completed: '[X]',
};

const STEP_ICONS: Record<number, string> = {
  1: '[DIAGNOSIS]',
  2: '[THERAPY]',
  3: '[SCHOOL]',
  4: '[INSURANCE]',
  5: '[COMMUNITY]',
};

// Colors
const COLORS = {
  primary: [16, 185, 129] as [number, number, number],      // Emerald
  dark: [30, 30, 30] as [number, number, number],
  medium: [80, 80, 80] as [number, number, number],
  light: [120, 120, 120] as [number, number, number],
  muted: [160, 160, 160] as [number, number, number],
  divider: [220, 220, 220] as [number, number, number],
  accent: [212, 175, 55] as [number, number, number],       // Gold accent
};

export async function generateRoadmapPDF(options: PDFGeneratorOptions): Promise<void> {
  const { location, steps, getStepStatus, format } = options;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => {
    pdf.addPage();
    y = margin;
    addHeaderLine();
  };

  const addHeaderLine = () => {
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 12, pageWidth - margin, 12);
  };

  const checkPageBreak = (height: number) => {
    if (y + height > pageHeight - 25) {
      addPage();
    }
  };

  // ============ HEADER ============
  // Top accent line
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  y = 20;

  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.dark);
  pdf.text('AUTISM SUPPORT ROADMAP', margin, y);
  y += 8;

  // Subtitle based on format
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.medium);
  const subtitle = format === 'detailed' ? 'Detailed Action Plan' : 'Quick Reference Card';
  pdf.text(subtitle, margin, y);
  y += 12;

  // Divider
  pdf.setDrawColor(...COLORS.divider);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ============ LOCATION INFO BOX ============
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.dark);
  pdf.text('YOUR INFORMATION', margin + 5, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.medium);
  pdf.setFontSize(10);

  const col1X = margin + 5;
  const col2X = margin + 90;

  pdf.text(`Location: ${location.county} County, ${location.state}`, col1X, y + 13);
  pdf.text(`ZIP Code: ${location.zipCode}`, col2X, y + 13);

  const ageLabel = location.ageRange === '0-3' ? '0-3 years (Early Intervention Priority)'
    : location.ageRange === '3-5' ? '3-5 years (Diagnosis & School Priority)'
      : '6+ years (School & Therapy Priority)';
  pdf.text(`Child's Age: ${ageLabel}`, col1X, y + 20);

  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, col2X, y + 20);

  y += 36;

  // Get steps in age-appropriate order
  const orderedStepIds = getOrderedStepsForAge(location.ageRange);
  const orderedSteps = orderedStepIds
    .map(id => steps.find(s => s.id === id))
    .filter((s): s is RoadmapStep => s !== undefined);

  if (format === 'detailed') {
    // ============ DETAILED ACTION PLAN ============

    for (const step of orderedSteps) {
      const status = getStepStatus(step.id);
      const recommendation = isStepRecommendedForAge(step.id, location.ageRange);

      checkPageBreak(85);

      // Step header bar - color based on priority
      const headerColor = recommendation === 'urgent'
        ? [220, 38, 38] as [number, number, number]  // Red for urgent
        : recommendation === 'priority'
          ? COLORS.primary
          : [100, 100, 100] as [number, number, number];  // Gray for optional

      pdf.setFillColor(...headerColor);
      pdf.rect(margin, y, contentWidth, 10, 'F');

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      const priorityLabel = recommendation === 'urgent' ? ' [URGENT]' : recommendation === 'priority' ? ' [Priority]' : '';
      pdf.text(`STEP ${step.id}: ${step.title.toUpperCase()}${priorityLabel}`, margin + 4, y + 7);
      y += 14;

      // Status and Timeline row
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.dark);
      pdf.text(`Status: ${STATUS_SYMBOLS[status]} ${STATUS_LABELS[status]}`, margin, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.light);
      pdf.text(`Timeline: ${step.timeline}`, margin + 70, y);
      y += 7;

      // Description
      pdf.setFontSize(10);
      pdf.setTextColor(...COLORS.medium);
      const descLines = pdf.splitTextToSize(step.description, contentWidth);
      pdf.text(descLines, margin, y);
      y += descLines.length * 4.5 + 5;

      // Documents section
      checkPageBreak(step.documents.length * 5 + 15);

      pdf.setFillColor(248, 250, 252);
      const docsHeight = step.documents.length * 5 + 10;
      pdf.roundedRect(margin, y, contentWidth, docsHeight, 2, 2, 'F');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.dark);
      pdf.text('DOCUMENTS CHECKLIST:', margin + 4, y + 6);
      y += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.medium);
      for (const doc of step.documents) {
        pdf.text(`[ ] ${doc}`, margin + 6, y);
        y += 5;
      }
      y += 5;

      // Important note
      checkPageBreak(15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(...COLORS.light);
      const noteLines = pdf.splitTextToSize(`Important: ${step.whatItDoesNot}`, contentWidth - 4);
      pdf.text(noteLines, margin + 2, y);
      y += noteLines.length * 3.5 + 5;

      // Notes lines
      checkPageBreak(25);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.dark);
      pdf.text('MY NOTES:', margin, y);
      y += 5;

      pdf.setDrawColor(...COLORS.muted);
      pdf.setLineWidth(0.2);
      for (let i = 0; i < 3; i++) {
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
      }
      y += 10;

      // Divider between steps
      if (step.id < steps.length) {
        pdf.setDrawColor(...COLORS.divider);
        pdf.setLineWidth(0.5);
        pdf.line(margin + 30, y - 5, pageWidth - margin - 30, y - 5);
      }
    }

  } else {
    // ============ QUICK REFERENCE CARD ============

    // Progress Overview
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('PROGRESS OVERVIEW', margin, y);
    y += 8;

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
    y += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    for (const step of orderedSteps) {
      const status = getStepStatus(step.id);
      const recommendation = isStepRecommendedForAge(step.id, location.ageRange);
      const priorityMarker = recommendation === 'urgent' ? '!' : recommendation === 'priority' ? '*' : ' ';
      pdf.setTextColor(...COLORS.medium);
      pdf.text(`${STATUS_SYMBOLS[status]}`, margin + 4, y);
      pdf.setTextColor(...COLORS.dark);
      pdf.text(`${priorityMarker} Step ${step.id}: ${step.title}`, margin + 16, y);
      pdf.setTextColor(...COLORS.light);
      pdf.text(`- ${STATUS_LABELS[status]}`, margin + 105, y);
      y += 5.5;
    }
    y += 10;

    // Key Contacts
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('KEY CONTACTS', margin, y);
    y += 8;

    pdf.setFillColor(...COLORS.primary);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`* School District Special Education: ${location.county} County Schools`, margin + 4, y + 7);
    pdf.text('* Early Intervention Referral: Call 211 or your pediatrician', margin + 4, y + 14);
    pdf.text('* State Medicaid/Insurance: Visit your state health services website', margin + 4, y + 21);
    y += 38;

    // Immediate Actions
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('YOUR NEXT 3 ACTIONS', margin, y);
    y += 8;

    const inProgressSteps = steps.filter(s => getStepStatus(s.id) === 'in_progress');
    const notStartedSteps = steps.filter(s => getStepStatus(s.id) === 'not_started');
    const prioritySteps = [...inProgressSteps, ...notStartedSteps].slice(0, 3);

    let actionNum = 1;
    for (const step of prioritySteps) {
      pdf.setFillColor(248, 250, 252);

      const actionText = `${step.title}: ${step.description}`;
      const actionLines = pdf.splitTextToSize(actionText, contentWidth - 20);
      const boxHeight = actionLines.length * 4 + 8;

      pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');

      // Number circle
      pdf.setFillColor(...COLORS.primary);
      pdf.circle(margin + 6, y + boxHeight / 2, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(actionNum), margin + 4.5, y + boxHeight / 2 + 1);

      pdf.setTextColor(...COLORS.dark);
      pdf.setFont('helvetica', 'normal');
      pdf.text(actionLines, margin + 14, y + 6);

      y += boxHeight + 4;
      actionNum++;
    }
    y += 8;

    // Remember section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.dark);
    pdf.text('REMEMBER', margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.medium);

    const reminders = [
      '-> Always keep copies of all documents',
      '-> Put ALL requests to schools in writing',
      '-> You can request IEP meetings at any time',
      '-> Every child\'s journey is unique - take it one step at a time'
    ];

    for (const reminder of reminders) {
      pdf.text(reminder, margin + 2, y);
      y += 5;
    }
  }

  // ============ FOOTER ============
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(...COLORS.divider);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.muted);
    pdf.text('NeuroKid Autism Support Roadmap', margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save
  const filename = format === 'detailed'
    ? 'autism-roadmap-action-plan.pdf'
    : 'autism-roadmap-quick-reference.pdf';
  pdf.save(filename);
}
