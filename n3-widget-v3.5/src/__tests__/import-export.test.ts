import { describe, it, expect } from "vitest";
import { DEFAULT_CHAR, exportChar, importChar } from "../char-types";
import type { CharState } from "../char-types";

import charMinimal from "./fixtures/char-minimal.json";
import charFull from "./fixtures/char-full.json";
import charPartial from "./fixtures/char-partial.json";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** All keys that every exported character must carry. */
const REQUIRED_KEYS: (keyof CharState)[] = [
  "name", "player", "pronouns", "characterConcept", "costumeNotes", "source",
  "aspect1", "aspect2", "aspect3", "chosenTrait",
  "foundation", "foundation2",
  "culture", "culture2", "culture3",
  "domain",
  "aspectSkillsPurchased", "foundationSkillsPurchased",
  "cultureSkillsPurchased", "domainSkillsPurchased",
  "excellencies", "expressions",
  "prowessPurchased", "insightPurchased", "fortitudePurchased",
  "voidVal", "purposePurchased", "vitalityPurchased",
  "armorType",
  "openSkillsPurchased",
  "excellencySkillsPurchased", "expressionSkillsPurchased",
  "hiddenExcellencies", "hiddenExcellencySkillsPurchased", "hiddenExcellencyFixedCost",
  "hiddenExpressions", "hiddenExpressionSkillsPurchased", "hiddenExpressionFixedCost",
  "abilitiesNotes", "notes", "threadNotes",
  "bonusCP",
];

// ─── round-trip fidelity ─────────────────────────────────────────────────────

describe("export → import round-trip", () => {
  it("minimal character: all fields survive serialization intact", () => {
    const original = charMinimal as CharState;
    const json = exportChar(original);
    const restored = importChar(DEFAULT_CHAR, json);
    expect(restored).toEqual({ ...DEFAULT_CHAR, ...original });
  });

  it("full character: all fields survive serialization intact", () => {
    const original = charFull as CharState;
    const json = exportChar(original);
    const restored = importChar(DEFAULT_CHAR, json);
    expect(restored).toEqual({ ...DEFAULT_CHAR, ...original });
  });

  it("produces valid JSON", () => {
    expect(() => JSON.parse(exportChar(charFull as CharState))).not.toThrow();
  });

  it("exported JSON is pretty-printed (human-readable)", () => {
    const json = exportChar(charMinimal as CharState);
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });
});

// ─── all required keys survive ───────────────────────────────────────────────

describe("required keys present after round-trip", () => {
  it("minimal character has all required keys", () => {
    const restored = importChar(DEFAULT_CHAR, exportChar(charMinimal as CharState));
    for (const key of REQUIRED_KEYS) {
      expect(restored).toHaveProperty(key);
    }
  });

  it("full character has all required keys", () => {
    const restored = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    for (const key of REQUIRED_KEYS) {
      expect(restored).toHaveProperty(key);
    }
  });
});

// ─── type fidelity ───────────────────────────────────────────────────────────

describe("type fidelity after round-trip", () => {
  it("numeric fields remain numbers", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(typeof r.prowessPurchased).toBe("number");
    expect(typeof r.insightPurchased).toBe("number");
    expect(typeof r.fortitudePurchased).toBe("number");
    expect(typeof r.voidVal).toBe("number");
    expect(typeof r.purposePurchased).toBe("number");
    expect(typeof r.vitalityPurchased).toBe("number");
    expect(typeof r.bonusCP).toBe("number");
  });

  it("array fields remain arrays", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(Array.isArray(r.excellencies)).toBe(true);
    expect(Array.isArray(r.expressions)).toBe(true);
    expect(Array.isArray(r.aspectSkillsPurchased)).toBe(true);
    expect(Array.isArray(r.openSkillsPurchased)).toBe(true);
    expect(Array.isArray(r.hiddenExcellencies)).toBe(true);
    expect(Array.isArray(r.hiddenExpressions)).toBe(true);
  });

  it("record fields remain plain objects", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(typeof r.excellencySkillsPurchased).toBe("object");
    expect(Array.isArray(r.excellencySkillsPurchased)).toBe(false);
    expect(typeof r.expressionSkillsPurchased).toBe("object");
    expect(typeof r.hiddenExcellencySkillsPurchased).toBe("object");
    expect(typeof r.hiddenExpressionSkillsPurchased).toBe("object");
  });

  it("PurchasedSkill entries have name:string and cost:number", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    for (const skill of r.openSkillsPurchased) {
      expect(typeof skill.name).toBe("string");
      expect(typeof skill.cost).toBe("number");
    }
    for (const skills of Object.values(r.excellencySkillsPurchased)) {
      for (const skill of skills) {
        expect(typeof skill.name).toBe("string");
        expect(typeof skill.cost).toBe("number");
      }
    }
  });
});

// ─── partial import merges with defaults ─────────────────────────────────────

describe("partial import (char-partial fixture)", () => {
  it("specified fields overwrite defaults", () => {
    const merged = importChar(DEFAULT_CHAR, JSON.stringify(charPartial));
    expect(merged.name).toBe("Corvin Dusk");
    expect(merged.player).toBe("Alex P.");
    expect(merged.aspect1).toBe("Shade");
    expect(merged.domain).toBe("Lightning");
    expect(merged.excellencies).toEqual(["Dervish"]);
    expect(merged.prowessPurchased).toBe(3);
    expect(merged.armorType).toBe("Medium Armor");
    expect(merged.bonusCP).toBe(2);
  });

  it("unspecified fields fall back to defaults", () => {
    const merged = importChar(DEFAULT_CHAR, JSON.stringify(charPartial));
    expect(merged.player).toBe("Alex P.");      // specified
    expect(merged.pronouns).toBe("");            // default
    expect(merged.aspect2).toBe("");             // default
    expect(merged.foundation).toBe("");          // default
    expect(merged.culture).toBe("");             // default
    expect(merged.expressions).toEqual([]);      // default
    expect(merged.insightPurchased).toBe(0);     // default
    expect(merged.fortitudePurchased).toBe(0);   // default
    expect(merged.notes).toBe("");               // default
  });

  it("excellencySkillsPurchased from partial import is present and correct", () => {
    const merged = importChar(DEFAULT_CHAR, JSON.stringify(charPartial));
    expect(merged.excellencySkillsPurchased["Dervish"]).toHaveLength(2);
    expect(merged.excellencySkillsPurchased["Dervish"][0].name).toBe("Flurry of Blows");
    expect(merged.excellencySkillsPurchased["Dervish"][0].cost).toBe(0);
    expect(merged.excellencySkillsPurchased["Dervish"][1].name).toBe("Painful Strike");
    expect(merged.excellencySkillsPurchased["Dervish"][1].cost).toBe(4);
  });

  it("all required keys still present after partial import", () => {
    const merged = importChar(DEFAULT_CHAR, JSON.stringify(charPartial));
    for (const key of REQUIRED_KEYS) {
      expect(merged).toHaveProperty(key);
    }
  });
});

// ─── hidden excellencies & expressions ──────────────────────────────────────

describe("hidden excellencies and expressions", () => {
  it("hidden excellency list survives round-trip", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(r.hiddenExcellencies).toEqual(["Reservoir"]);
  });

  it("hidden excellency skills survive round-trip", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(r.hiddenExcellencySkillsPurchased["Reservoir"]).toHaveLength(3);
    expect(r.hiddenExcellencySkillsPurchased["Reservoir"][0].name).toBe("Healing Reservoir");
    expect(r.hiddenExcellencySkillsPurchased["Reservoir"][0].cost).toBe(0);
  });

  it("hidden expression list survives round-trip", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(r.hiddenExpressions).toEqual(["Shadewalker"]);
  });

  it("hidden expression skills survive round-trip", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(r.hiddenExpressionSkillsPurchased["Shadewalker"]).toHaveLength(2);
    expect(r.hiddenExpressionSkillsPurchased["Shadewalker"][1].name).toBe("Find the Shade");
    expect(r.hiddenExpressionSkillsPurchased["Shadewalker"][1].cost).toBe(2);
  });
});

// ─── fixture internal consistency ────────────────────────────────────────────

describe("fixture consistency", () => {
  it("full fixture: every excellency in list has a matching skills entry", () => {
    const f = charFull as CharState;
    for (const exc of f.excellencies) {
      expect(f.excellencySkillsPurchased).toHaveProperty(exc);
    }
  });

  it("full fixture: every expression in list has a matching skills entry", () => {
    const f = charFull as CharState;
    for (const expr of f.expressions) {
      expect(f.expressionSkillsPurchased).toHaveProperty(expr);
    }
  });

  it("full fixture: every hidden excellency has a matching skills entry", () => {
    const f = charFull as CharState;
    for (const he of f.hiddenExcellencies) {
      expect(f.hiddenExcellencySkillsPurchased).toHaveProperty(he);
    }
  });

  it("full fixture: every hidden expression has a matching skills entry", () => {
    const f = charFull as CharState;
    for (const hx of f.hiddenExpressions) {
      expect(f.hiddenExpressionSkillsPurchased).toHaveProperty(hx);
    }
  });

  it("full fixture: all PurchasedSkill entries are well-formed", () => {
    const f = charFull as CharState;
    const allSkillLists = [
      ...f.aspectSkillsPurchased,
      ...f.foundationSkillsPurchased,
      ...f.cultureSkillsPurchased,
      ...f.domainSkillsPurchased,
      ...f.openSkillsPurchased,
      ...Object.values(f.excellencySkillsPurchased).flat(),
      ...Object.values(f.expressionSkillsPurchased).flat(),
      ...Object.values(f.hiddenExcellencySkillsPurchased).flat(),
      ...Object.values(f.hiddenExpressionSkillsPurchased).flat(),
    ];
    for (const s of allSkillLists) {
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
      expect(typeof s.cost).toBe("number");
      expect(s.cost).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── optional fields ─────────────────────────────────────────────────────────

describe("optional fields", () => {
  it("optional fields present in full fixture survive round-trip", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charFull as CharState));
    expect(r.craftingNotes).toBe("Can craft basic healing elixirs if near an alchemy lab.");
    expect(r.history).toBe("Decorated archer, disgraced officer, wandering pilgrim.");
    expect(r.cpLog).toContain("Event 1:");
    expect(r.drakar).toBe("14");
    expect(r.ketch).toBe("3");
  });

  it("optional fields absent in minimal fixture are undefined after round-trip from defaults", () => {
    const r = importChar(DEFAULT_CHAR, exportChar(charMinimal as CharState));
    // charMinimal doesn't include optional fields, so they remain at DEFAULT_CHAR values (undefined)
    expect(r.craftingNotes).toBeUndefined();
    expect(r.history).toBeUndefined();
    expect(r.cpLog).toBeUndefined();
  });
});

// ─── invalid input rejection ─────────────────────────────────────────────────

describe("importChar rejects invalid input", () => {
  it("throws on empty string", () => {
    expect(() => importChar(DEFAULT_CHAR, "")).toThrow();
  });

  it("throws on whitespace-only string", () => {
    expect(() => importChar(DEFAULT_CHAR, "   ")).toThrow();
  });

  it("throws on malformed JSON", () => {
    expect(() => importChar(DEFAULT_CHAR, "{ name: missing quotes }")).toThrow();
  });

  it("throws on JSON string primitive", () => {
    expect(() => importChar(DEFAULT_CHAR, '"just a string"')).toThrow();
  });

  it("throws on JSON number primitive", () => {
    expect(() => importChar(DEFAULT_CHAR, "42")).toThrow();
  });

  it("throws on JSON null", () => {
    expect(() => importChar(DEFAULT_CHAR, "null")).toThrow();
  });

  it("throws on JSON array", () => {
    expect(() => importChar(DEFAULT_CHAR, '[{"name":"test"}]')).toThrow();
  });
});

// ─── extra / unknown fields ──────────────────────────────────────────────────

describe("forward compatibility: extra fields in JSON", () => {
  it("unknown fields in JSON are accepted without throwing", () => {
    const withExtra = JSON.stringify({ ...charMinimal, futureField: "some value", _version: 2 });
    expect(() => importChar(DEFAULT_CHAR, withExtra)).not.toThrow();
  });

  it("known fields in JSON with extra fields are still correct", () => {
    const withExtra = JSON.stringify({ ...charMinimal, futureField: "some value" });
    const r = importChar(DEFAULT_CHAR, withExtra);
    expect(r.name).toBe((charMinimal as CharState).name);
    expect(r.aspect1).toBe((charMinimal as CharState).aspect1);
  });
});
