/**
 * Case Study Helpers
 * Utilities for grouping and organizing dental data for case studies
 */

export interface VisitData {
  visitId: string;
  date: Date;
  observations: any[];
  procedures: any[];
  attachments: any[];
}

export interface ToothTreatmentGroup {
  toothNumber: string;
  visits: VisitData[];
  summary: {
    totalVisits: number;
    dateRange: { start: Date; end: Date } | null;
    treatmentType: string;
  };
}

/**
 * Group observations, procedures, and attachments by tooth and organize by visit date
 */
export function groupByTooth(
  observations: any[],
  procedures: any[],
  attachments: any[]
): Map<string, ToothTreatmentGroup> {
  const groups = new Map<string, ToothTreatmentGroup>();

  // First, organize observations by tooth
  observations.forEach(obs => {
    // Each observation has tooth_numbers array
    const toothNumbers = Array.isArray(obs.tooth_numbers) ? obs.tooth_numbers : [obs.tooth_number];

    toothNumbers.forEach((toothNum: string) => {
      if (!toothNum) return;

      // Initialize group if doesn't exist
      if (!groups.has(toothNum)) {
        groups.set(toothNum, {
          toothNumber: toothNum,
          visits: [],
          summary: {
            totalVisits: 0,
            dateRange: null,
            treatmentType: '',
          },
        });
      }

      const group = groups.get(toothNum)!;

      // Find or create visit for this observation's date
      const obsDate = new Date(obs.created_at || obs.appointment_date || Date.now());
      let visit = findOrCreateVisit(group.visits, obsDate, obs.id);

      // Add observation to visit
      visit.observations.push(obs);

      // Find related procedures for this observation
      const relatedProcs = procedures.filter(p => p.observation_id === obs.id);
      relatedProcs.forEach(proc => {
        if (!visit.procedures.some(p => p.id === proc.id)) {
          visit.procedures.push(proc);
        }
      });

      // Find related attachments for this observation
      const relatedAtts = attachments.filter(a => a.observation_id === obs.id);
      relatedAtts.forEach(att => {
        if (!visit.attachments.some(a => a.id === att.id)) {
          visit.attachments.push(att);
        }
      });
    });
  });

  // Add standalone procedures (not linked to observations)
  procedures.forEach(proc => {
    if (!proc.observation_id && proc.tooth_numbers) {
      const toothNumbers = Array.isArray(proc.tooth_numbers) ? proc.tooth_numbers : [proc.tooth_number];

      toothNumbers.forEach((toothNum: string) => {
        if (!toothNum) return;

        if (!groups.has(toothNum)) {
          groups.set(toothNum, {
            toothNumber: toothNum,
            visits: [],
            summary: {
              totalVisits: 0,
              dateRange: null,
              treatmentType: '',
            },
          });
        }

        const group = groups.get(toothNum)!;
        const procDate = new Date(proc.procedure_date || proc.created_at || Date.now());
        let visit = findOrCreateVisit(group.visits, procDate, proc.id);

        if (!visit.procedures.some(p => p.id === proc.id)) {
          visit.procedures.push(proc);
        }

        // Find related attachments
        const relatedAtts = attachments.filter(a => a.procedure_id === proc.id);
        relatedAtts.forEach(att => {
          if (!visit.attachments.some(a => a.id === att.id)) {
            visit.attachments.push(att);
          }
        });
      });
    }
  });

  // Calculate summaries for each group
  groups.forEach(group => {
    // Sort visits by date
    group.visits.sort((a, b) => a.date.getTime() - b.date.getTime());

    group.summary.totalVisits = group.visits.length;
    group.summary.dateRange = calculateDateRange(group.visits);
    group.summary.treatmentType = inferTreatmentType(group.visits);
  });

  return groups;
}

/**
 * Find existing visit or create new one based on date proximity
 * Groups items on same day or within 12 hours
 */
function findOrCreateVisit(visits: VisitData[], date: Date, itemId: string): VisitData {
  // Check if visit exists within 12 hours of this date
  const existingVisit = visits.find(v => {
    const diff = Math.abs(v.date.getTime() - date.getTime());
    return diff < 12 * 60 * 60 * 1000; // 12 hours
  });

  if (existingVisit) {
    return existingVisit;
  }

  // Create new visit
  const newVisit: VisitData = {
    visitId: `visit_${date.getTime()}_${itemId}`,
    date,
    observations: [],
    procedures: [],
    attachments: [],
  };

  visits.push(newVisit);
  return newVisit;
}

/**
 * Calculate date range from visits
 */
function calculateDateRange(visits: VisitData[]): { start: Date; end: Date } | null {
  if (visits.length === 0) return null;

  const dates = visits.map(v => v.date.getTime());
  return {
    start: new Date(Math.min(...dates)),
    end: new Date(Math.max(...dates)),
  };
}

/**
 * Infer treatment type from procedure names
 */
function inferTreatmentType(visits: VisitData[]): string {
  const procedureNames = visits
    .flatMap(v => v.procedures)
    .map(p => (p.procedure_name || p.name || '').toLowerCase());

  const observationTypes = visits
    .flatMap(v => v.observations)
    .map(o => (o.condition_type || '').toLowerCase());

  const allText = [...procedureNames, ...observationTypes].join(' ');

  // Root Canal Treatment
  if (allText.includes('root canal') || allText.includes('rct') || allText.includes('endodontic')) {
    return 'Root Canal Treatment';
  }

  // Extraction
  if (allText.includes('extraction') || allText.includes('remove') || allText.includes('pull')) {
    return 'Extraction';
  }

  // Crown/Bridge
  if (allText.includes('crown') || allText.includes('bridge') || allText.includes('cap')) {
    return 'Prosthetic Treatment';
  }

  // Filling/Restoration
  if (allText.includes('filling') || allText.includes('restoration') || allText.includes('composite') || allText.includes('amalgam')) {
    return 'Restorative Treatment';
  }

  // Implant
  if (allText.includes('implant')) {
    return 'Implant Treatment';
  }

  // Orthodontic
  if (allText.includes('braces') || allText.includes('orthodontic') || allText.includes('alignment')) {
    return 'Orthodontic Treatment';
  }

  // Periodontal
  if (allText.includes('scaling') || allText.includes('cleaning') || allText.includes('periodontal') || allText.includes('gum')) {
    return 'Periodontal Treatment';
  }

  // Whitening
  if (allText.includes('whitening') || allText.includes('bleaching')) {
    return 'Cosmetic Treatment';
  }

  // Default
  return 'General Treatment';
}

/**
 * Get formatted date range string
 */
export function formatDateRange(dateRange: { start: Date; end: Date } | null): string {
  if (!dateRange) return 'No dates';

  const start = dateRange.start;
  const end = dateRange.end;

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const optionsWithYear: Intl.DateTimeFormatOptions = { ...options, year: 'numeric' };

  if (start.getTime() === end.getTime()) {
    // Same day
    return start.toLocaleDateString('en-US', optionsWithYear);
  }

  if (start.getFullYear() === end.getFullYear()) {
    // Same year
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', optionsWithYear)}`;
  }

  // Different years
  return `${start.toLocaleDateString('en-US', optionsWithYear)} - ${end.toLocaleDateString('en-US', optionsWithYear)}`;
}

/**
 * Sort tooth numbers in FDI notation order
 */
export function sortToothNumbers(teeth: string[]): string[] {
  return teeth.sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    return numA - numB;
  });
}
