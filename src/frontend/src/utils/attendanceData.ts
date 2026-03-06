// ── Department configuration ─────────────────────────────────

export interface DeptConfig {
  label: string;
  code: string;
  ranges: Record<number, [number, number]>;
}

export const DEPT_CONFIG: Record<string, DeptConfig> = {
  AIDS: {
    label: "CSE (AIDS)",
    code: "AD",
    ranges: { 1: [101, 170], 2: [101, 145], 3: [101, 155], 4: [101, 137] },
  },
  AIML: {
    label: "CSE (AIML)",
    code: "AM",
    ranges: { 1: [101, 163], 2: [101, 160], 3: [101, 154], 4: [101, 144] },
  },
  CSE: {
    label: "CSE",
    code: "CS",
    ranges: { 1: [101, 160], 2: [101, 158], 3: [101, 150], 4: [101, 138] },
  },
  ECE: {
    label: "ECE",
    code: "EC",
    ranges: { 1: [101, 158], 2: [101, 153], 3: [101, 147], 4: [101, 140] },
  },
  EEE: {
    label: "EEE",
    code: "EE",
    ranges: { 1: [101, 160], 2: [101, 158], 3: [101, 160], 4: [101, 140] },
  },
};

export const YEAR_CODE: Record<number, string> = {
  1: "25",
  2: "24",
  3: "23",
  4: "22",
};

// ── Dynamic student list generator ──────────────────────────

export function getStudentsForDept(deptKey: string, year: number): string[] {
  const dept = DEPT_CONFIG[deptKey];
  if (!dept) return [];
  const range = dept.ranges[year];
  if (!range) return [];
  const yearCode = YEAR_CODE[year];
  if (!yearCode) return [];

  const [start, end] = range;
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const num = start + i;
    return `7116${yearCode}${dept.code}${num}`;
  });
}

// ── Validate a registration number for a given dept+year ─────

export function isValidRegNoForDept(
  regNo: string,
  deptKey: string,
  year: number,
): boolean {
  const dept = DEPT_CONFIG[deptKey];
  if (!dept) return false;
  const range = dept.ranges[year];
  if (!range) return false;
  const yearCode = YEAR_CODE[year];
  if (!yearCode) return false;

  const prefix = `7116${yearCode}${dept.code}`;
  const upper = regNo.trim().toUpperCase();
  if (!upper.startsWith(prefix.toUpperCase())) return false;
  const numStr = upper.slice(prefix.length);
  const num = Number.parseInt(numStr, 10);
  if (Number.isNaN(num)) return false;
  return num >= range[0] && num <= range[1];
}

// ── Human-readable label ──────────────────────────────────────

export function getDeptYearLabel(deptKey: string, year: number): string {
  const dept = DEPT_CONFIG[deptKey];
  const yearSuffix = ["1st", "2nd", "3rd", "4th"][year - 1] ?? `${year}th`;
  if (!dept) return `${deptKey} - ${yearSuffix} Year`;
  return `${dept.label} - ${yearSuffix} Year`;
}

// ── Subject entry type ────────────────────────────────────────

export interface SubjectEntry {
  id: string;
  name: string;
}
