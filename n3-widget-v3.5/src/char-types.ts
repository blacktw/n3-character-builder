// Shared pure types and import/export logic — no React dependency.

export interface SkillDef {
  name: string;
  cost: number;
  verbal: string;
  description: string;
  attribute?: string;
  isAttributeOrArmor?: boolean;
  maxCount?: number;
  grantsAttributeChoice?: boolean;
}

export type AttributeChoice = "Prowess" | "Insight" | "Fortitude";

export interface PurchasedSkill {
  name: string;
  cost: number;
  attributeChoice?: AttributeChoice;
}

export interface CharState {
  name: string; player: string; pronouns: string;
  characterConcept: string; costumeNotes: string; source: string;
  aspect1: string; aspect2: string; aspect3: string;
  chosenTrait: string;
  foundation: string; foundation2: string;
  culture: string; culture2: string; culture3: string;
  domain: string;
  aspectSkillsPurchased: PurchasedSkill[];
  foundationSkillsPurchased: PurchasedSkill[];
  cultureSkillsPurchased: PurchasedSkill[];
  domainSkillsPurchased: PurchasedSkill[];
  excellencies: string[];
  expressions: string[];
  prowessPurchased: number; insightPurchased: number; fortitudePurchased: number;
  voidVal: number; purposePurchased: number; vitalityPurchased: number;
  armorType: string;
  openSkillsPurchased: PurchasedSkill[];
  savantFreeSkill1: string;
  savantFreeSkill2: string;
  excellencySkillsPurchased: Record<string, PurchasedSkill[]>;
  expressionSkillsPurchased: Record<string, PurchasedSkill[]>;
  hiddenExcellencies: string[];
  hiddenExcellencySkillsPurchased: Record<string, PurchasedSkill[]>;
  hiddenExpressions: string[];
  hiddenExpressionSkillsPurchased: Record<string, PurchasedSkill[]>;
  abilitiesNotes: string; notes: string; threadNotes: string;
  bonusCP: number;
  craftingNotes?: string;
  history?: string;
  contactsNotes?: string;
  infoSkillsNotes?: string;
  drakar?: string; ketch?: string; reel?: string;
  holding?: string;
  cpLog?: string;
}

export const DEFAULT_CHAR: CharState = {
  name: "", player: "", pronouns: "", characterConcept: "", costumeNotes: "", source: "Arcane",
  aspect1: "", aspect2: "", aspect3: "",
  chosenTrait: "",
  foundation: "", foundation2: "",
  culture: "", culture2: "", culture3: "",
  domain: "",
  aspectSkillsPurchased: [],
  foundationSkillsPurchased: [],
  cultureSkillsPurchased: [],
  domainSkillsPurchased: [],
  excellencies: [],
  expressions: [],
  prowessPurchased: 0, insightPurchased: 0, fortitudePurchased: 0,
  voidVal: 2, purposePurchased: 0, vitalityPurchased: 0,
  armorType: "Unarmored",
  openSkillsPurchased: [],
  savantFreeSkill1: "",
  savantFreeSkill2: "",
  excellencySkillsPurchased: {},
  expressionSkillsPurchased: {},
  hiddenExcellencies: [],
  hiddenExcellencySkillsPurchased: {},
  hiddenExpressions: [],
  hiddenExpressionSkillsPurchased: {},
  abilitiesNotes: "", notes: "", threadNotes: "",
  bonusCP: 0,
};

/** Serialise a character to the portable JSON format. */
export function exportChar(char: CharState): string {
  return JSON.stringify(char, null, 2);
}

/**
 * Merge a JSON string into the current character state.
 * Throws on invalid JSON or non-object payloads.
 */
export function importChar(current: CharState, jsonText: string): CharState {
  const parsed: unknown = JSON.parse(jsonText.trim());
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid format: expected a JSON object");
  }
  return { ...current, ...(parsed as Partial<CharState>) };
}
