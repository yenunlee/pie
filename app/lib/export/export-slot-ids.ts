export const EXPORT_COVER_ID = 'export-cover';
export const EXPORT_ABSTRACT_ID = 'export-abstract';

export function exportInterviewSlotId(pageIndex: number): string {
  return `export-interview-${String(pageIndex + 1).padStart(2, '0')}`;
}
