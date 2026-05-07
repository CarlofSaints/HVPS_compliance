import Anthropic from "@anthropic-ai/sdk";
import { getGuidelines, downloadGuidelineFile } from "./guidelineData";
import { extractTextFromBuffer } from "./pdfParser";

interface ComplianceResult {
  score: number;
  summary: string;
  risks: {
    severity: "low" | "medium" | "high";
    section: string;
    description: string;
    guideline_reference: string;
    suggestion: string;
  }[];
}

export async function runComplianceCheck(
  policyText: string,
  policyName: string,
  mode: "policy" | "document" = "policy"
): Promise<ComplianceResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const client = new Anthropic({ apiKey });

  // Load all guideline texts
  const guidelines = await getGuidelines();
  const guidelineTexts: string[] = [];

  for (const g of guidelines) {
    const fileBuffer = await downloadGuidelineFile(g.id, g.ext);
    if (fileBuffer) {
      try {
        const text = await extractTextFromBuffer(fileBuffer, g.ext);
        guidelineTexts.push(
          `--- Guideline: ${g.name} (Source: ${g.source}) ---\n${text}\n`
        );
      } catch {
        guidelineTexts.push(
          `--- Guideline: ${g.name} (Source: ${g.source}) ---\n[Could not extract text]\n`
        );
      }
    }
  }

  const guidelineSection =
    guidelineTexts.length > 0
      ? `\n\nREFERENCE GUIDELINES:\n${guidelineTexts.join("\n")}`
      : "\n\n(No specific guideline documents uploaded. Use your knowledge of SASA, GDE circulars, and SA education policy.)";

  const typeLabel = mode === "policy" ? "school policy" : "school document";

  const prompt = `You are a South African education compliance expert. Analyze the following ${typeLabel} for compliance with GDE (Gauteng Department of Education) and DoE (national Department of Education) guidelines, SASA (South African Schools Act), and best practices for school governance.

DOCUMENT NAME: ${policyName}

DOCUMENT TEXT:
${policyText}
${guidelineSection}

Analyze this ${typeLabel} and return a JSON object with this exact structure:
{
  "score": <number 0-100 representing overall compliance score>,
  "summary": "<overall assessment in 2-3 sentences>",
  "risks": [
    {
      "severity": "low" | "medium" | "high",
      "section": "<section/area of the document>",
      "description": "<what the issue is>",
      "guideline_reference": "<which guideline/act/regulation it relates to>",
      "suggestion": "<how to fix it>"
    }
  ]
}

Be thorough but fair. A score of 100 means fully compliant. Identify specific sections that need attention. Return ONLY the JSON object, no other text.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const result = JSON.parse(jsonMatch[0]) as ComplianceResult;

    // Validate structure
    if (
      typeof result.score !== "number" ||
      !result.summary ||
      !Array.isArray(result.risks)
    ) {
      throw new Error("Invalid response structure");
    }

    return result;
  } catch {
    return {
      score: 0,
      summary:
        "Unable to parse compliance check results. Please try again.",
      risks: [],
    };
  }
}
