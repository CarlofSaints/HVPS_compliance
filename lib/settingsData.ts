import { readJson, writeJson } from "./controlData";

export interface SpendSettings {
  capexBudget: number;
  capexYear: number;
  sourcesOfFunds: string[];
  supplierConnections: string[];
}

const SPEND_SETTINGS_PATH = "settings/spend-settings.json";

const DEFAULT_SPEND_SETTINGS: SpendSettings = {
  capexBudget: 0,
  capexYear: new Date().getFullYear(),
  sourcesOfFunds: ["Fundraising", "Grade 7 Gift", "CAPEX", "Expensed"],
  supplierConnections: [
    "None",
    "Parent",
    "SGB Member",
    "Friend of Parent",
    "Teacher",
    "Relative of Teacher",
    "Relative of Parent",
    "Relative of SGB Member",
  ],
};

export async function getSpendSettings(): Promise<SpendSettings> {
  return readJson<SpendSettings>(SPEND_SETTINGS_PATH, DEFAULT_SPEND_SETTINGS);
}

export async function saveSpendSettings(
  settings: SpendSettings
): Promise<void> {
  return writeJson(SPEND_SETTINGS_PATH, settings);
}
