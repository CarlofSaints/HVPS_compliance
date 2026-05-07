import { readJson, writeJson, writeFile, readFile, listFiles } from "./controlData";

export interface DocumentMeta {
  id: string;
  name: string;
  description: string;
  filename: string;
  ext: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  lastCheckScore: number | null;
  lastCheckDate: string | null;
}

export interface DocumentCheck {
  id: string;
  documentId: string;
  score: number;
  summary: string;
  risks: DocumentRisk[];
  checkedBy: string;
  checkedAt: string;
}

export interface DocumentRisk {
  severity: "low" | "medium" | "high";
  section: string;
  description: string;
  guideline_reference: string;
  suggestion: string;
}

const DOCUMENTS_INDEX = "documents/index.json";

export async function getDocuments(): Promise<DocumentMeta[]> {
  return readJson<DocumentMeta[]>(DOCUMENTS_INDEX, []);
}

export async function saveDocuments(docs: DocumentMeta[]): Promise<void> {
  return writeJson(DOCUMENTS_INDEX, docs);
}

export async function getDocumentById(
  id: string
): Promise<DocumentMeta | undefined> {
  const docs = await getDocuments();
  return docs.find((d) => d.id === id);
}

export async function createDocument(doc: DocumentMeta): Promise<void> {
  const docs = await getDocuments();
  docs.push(doc);
  await saveDocuments(docs);
}

export async function deleteDocument(id: string): Promise<boolean> {
  const docs = await getDocuments();
  const filtered = docs.filter((d) => d.id !== id);
  if (filtered.length === docs.length) return false;
  await saveDocuments(filtered);
  return true;
}

export async function uploadDocumentFile(
  id: string,
  filename: string,
  data: Buffer
): Promise<void> {
  await writeFile(`documents/${id}/${filename}`, data);
}

export async function downloadDocumentFile(
  id: string,
  filename: string
): Promise<Buffer | null> {
  return readFile(`documents/${id}/${filename}`);
}

export async function getDocumentChecks(
  docId: string
): Promise<DocumentCheck[]> {
  const files = await listFiles(`documents/${docId}/checks`);
  const checks: DocumentCheck[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      const check = await readJson<DocumentCheck>(
        `documents/${docId}/checks/${file}`,
        null as unknown as DocumentCheck
      );
      if (check) checks.push(check);
    }
  }
  return checks.sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  );
}

export async function saveDocumentCheck(
  docId: string,
  check: DocumentCheck
): Promise<void> {
  return writeJson(`documents/${docId}/checks/${check.id}.json`, check);
}
