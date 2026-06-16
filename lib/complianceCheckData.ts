import { readJson, writeJson, writeFile, readFile } from "./controlData";

export interface ComplianceCheckRisk {
  severity: "low" | "medium" | "high";
  section: string;
  description: string;
  guideline_reference: string;
  suggestion: string;
}

export interface ComplianceCheckRecord {
  id: string;
  name: string; // document name given by the user
  filename: string; // original uploaded filename (for download)
  ext: string;
  hash?: string; // sha256 of the uploaded file bytes (for duplicate detection)
  score: number;
  summary: string;
  risks: ComplianceCheckRisk[];
  sources?: { title: string; url: string }[];
  issueCount: number;
  checkedBy: string; // user id
  checkedByName: string;
  checkedAt: string;
}

const CHECKS_INDEX = "compliance/checks.json";

export async function getComplianceChecks(): Promise<ComplianceCheckRecord[]> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return [...checks].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  );
}

export async function getComplianceCheckById(
  id: string
): Promise<ComplianceCheckRecord | undefined> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return checks.find((c) => c.id === id);
}

// Duplicate detection by file content (sha256). Same bytes = duplicate, even
// if the document was renamed; an edited file produces a different hash and is
// treated as a new check.
export async function findComplianceCheckByHash(
  hash: string
): Promise<ComplianceCheckRecord | undefined> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return checks.find((c) => c.hash === hash);
}

// Saves the uploaded file alongside the check record so it can be downloaded later.
export async function addComplianceCheck(
  record: ComplianceCheckRecord,
  fileData: Buffer
): Promise<void> {
  await writeFile(`compliance/${record.id}/${record.filename}`, fileData);
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  checks.push(record);
  await writeJson(CHECKS_INDEX, checks);
}

export async function downloadComplianceCheckFile(
  id: string,
  filename: string
): Promise<Buffer | null> {
  return readFile(`compliance/${id}/${filename}`);
}
