import { useState, useCallback } from "react";
import type { SkillDef, PurchasedSkill, CharState } from "./char-types";
import { DEFAULT_CHAR } from "./char-types";

// ─── DATA ────────────────────────────────────────────────────────────────────

const ASPECTS = [
  "Arcane","Beast","Construct","Divine","Elemental","Ghost","Life","Plant","Shade"
];

const DOMAINS = ["Air","Earth","Fire","Ice","Lightning","Water"];

const FOUNDATIONS = [
  "Agriculture","Alchemical","Arcane","Artifice","Ecclesiastic","Entertainer",
  "Artistic","Heroic","Leisure","Mariner","Mendicant","Mercantile","Military",
  "Courts","Poverty","Reformed","Stargazer","Traveler","University","Wilderness"
];

const CULTURES = [
  { name:"Aluvair", research:"Natural Phenomena" },
  { name:"Dovenost", research:"Item provenance and craftsmanship" },
  { name:"Eltiel", research:"Military" },
  { name:"The Five Duchies", research:"Spirits of the Dead" },
  { name:"Kindaria", research:"Exploration" },
  { name:"Konnigstrava", research:"Rituals" },
  { name:"L'Dahn Linenation", research:"Historical References" },
  { name:"Merrigor", research:"Undead" },
  { name:"Melluria", research:"Earth Works/Geology" },
  { name:"Myos Islands", research:"Trade and Travel" },
  { name:"Ophrailes", research:"Magical Theory" },
  { name:"The Reach", research:"No unique research topic" },
  { name:"Rues", research:"Religion" },
  { name:"Scyllina", research:"Noble Intrigue" },
  { name:"Spyndelmere", research:"Magical Afflictions" },
  { name:"T'barris", research:"Hunting" },
];

const EXCELLENCIES_BY_DOMAIN = {
  Air: ["Ballista","Stalker"],
  Earth: ["Forge Fire","Locus","Armorsmith","Bladesmith"],
  Fire: ["Inferno","Slayer","Alchemist","Grenadier"],
  Ice: ["Bastion","Defender","Beguiler","Armorsmith"],
  Lightning: ["Dervish","Hurricane","Tempest","Combatant","Devastator","Bladesmith"],
  Water: ["Awakener","Wellspring","Naturalist","Alchemist"],
  Universal: ["Arcaneer","Combatant","Devastator","Grenadier","Naturalist","Alchemist","Beguiler","Bladesmith","Armorsmith"],
};

const ALL_EXCELLENCIES = [
  "Alchemist","Arcaneer","Armorsmith","Awakener","Ballista","Bastion",
  "Beguiler","Bladesmith","Combatant","Defender","Dervish","Devastator",
  "Forge Fire","Grenadier","Hurricane","Inferno","Locus","Naturalist",
  "Ordinator","Paladin","Poison Blade","Retributor","Sirocco","Slayer",
  "Stalker","Tempest","Tinkerer","Tornado","Volcano","Wellspring",
];

const EXCELLENCY_SKILLS: Record<string, SkillDef[]> = {
  "Ballista": [
    { name:"Trio of Arrows", cost:0, verbal:"'3 Damage'", description:"Free. Spend 1 Attribute to make two archery attacks of 3 damage.", attribute:"1 Insight" },
    { name:"Refresh Quiver", cost:4, verbal:"'Refresh Quiver to self'", description:"Spend 1 Attribute to instantly refresh your quiver. Effects triggered by quiver refresh are activated.", attribute:"1 Prowess" },
    { name:"Extended Quiver", cost:2, verbal:"N/A", description:"Once per Short Rest, refresh your quiver with a 10-second focus." },
    { name:"Prepare Arrow", cost:3, verbal:"N/A", description:"Once per Short Rest, add +3 damage to a called damage archery attack. Thread Skill.", attribute:"Thread Skill" },
    { name:"Rain of Arrows", cost:3, verbal:"N/A", description:"Add +1 damage to a called damage archery effect if targeting a different target than your last missile attack. Thread Skill.", attribute:"Thread Skill" },
    { name:"Restring Bow", cost:4, verbal:"'Restring Bow'", description:"Restring your bow in 3 seconds instead of 10 seconds." },
    { name:"Half Score of Arrows", cost:2, verbal:"'3 Damage'", description:"Once per event, call upon the Air and grant yourself 10 additional missile attacks of 3 damage by bow or crossbow." },
    { name:"Refresh Ally", cost:4, verbal:"'Refresh Quiver'", description:"Use a touch packet to refresh another person's quiver.", attribute:"1 Insight" },
  ],
  "Stalker": [
    { name:"Sharpened Arrow", cost:0, verbal:"'4 Damage'", description:"Free. Make a basic archery attack of 4 damage.", attribute:"1 Insight" },
    { name:"First Blood", cost:3, verbal:"See description", description:"The first archery attack after refreshing your quiver is +3 damage. If your first arrow is uncalled, you may use a called '4 Damage' attack. Thread Skill.", attribute:"Thread Skill" },
    { name:"Target of Ire", cost:3, verbal:"'Imbue to self'", description:"Once per Short Rest, take 10 seconds to identify a target (cannot move, attack, or use skills). All called damage archery attacks toward that target are +2 damage until you hit anyone else. Thread Skill.", attribute:"Thread Skill" },
    { name:"Hooked Arrow", cost:4, verbal:"'Agony'", description:"Use an arrow with barbed ends to distract your foe.", attribute:"1 Fortitude" },
    { name:"Penetrating Arrow", cost:4, verbal:"'8 Damage'", description:"Once per Long Rest, use a specially prepared arrow.", attribute:"1 Insight" },
    { name:"Watching Your Target", cost:4, verbal:"'Avoid'", description:"If your designated target attacks you, spend 1 Attribute to negate the attack.", attribute:"1 Fortitude" },
    { name:"Set Your Sights", cost:2, verbal:"'Imbue to self'", description:"Twice per event, instantly choose a new target without studying them." },
    { name:"Celebration of a Kill", cost:3, verbal:"'Heal 2 to Self'", description:"If you kill your target, heal 2 to self." },
  ],
  "Forge Fire": [
    { name:"Serrated Blade", cost:0, verbal:"'Grant Melee attack Agony'", description:"Free. Grant Melee Attack 'Agony.'", attribute:"1 Insight" },
    { name:"Armor Repair", cost:4, verbal:"'Repair 1 Armor'", description:"When Centered, gain 4 uses of 'Repair Armor'. If not Centered, gain 2 uses. New activation discards unused uses.", attribute:"1 Fortitude" },
    { name:"Weapon Repair", cost:2, verbal:"'Repair Weapon'", description:"When Centered, spend 30 seconds to repair a destroyed weapon or shield. If not Centered, spend 1 minute." },
    { name:"Sharpen Weapon", cost:4, verbal:"'Grant Melee Attack 3 Damage'", description:"Grant a melee attack to companions or yourself.", attribute:"1 Insight" },
    { name:"Sharpen Arrow", cost:4, verbal:"'Grant Missile Attack 4 Damage'", description:"Grant a missile attack to companions or yourself.", attribute:"1 Fortitude" },
    { name:"Heat the Forge", cost:3, verbal:"N/A", description:"When Centered, Sharpen Weapon and Sharpen Arrow gain an additional Grant effect. Can be purchased twice. Thread Skill.", attribute:"Thread Skill" },
    { name:"Special Blade", cost:2, verbal:"'Grant melee attack 5 damage'", description:"Once per event, when Centered, gain three uses of 'Grant melee attack 5 damage' to give to allies." },
  ],
  "Locus": [
    { name:"Channel Healing", cost:0, verbal:"'Heal by your <beneficial Trait>'", description:"Free. Gain 3 Heal effects if Centered; 1 if not Centered.", attribute:"1 Insight" },
    { name:"Watch the Battle", cost:4, verbal:"'Grant 4 protection to self'", description:"The first time after a Long Rest when you become Centered, gain 4 points of Protection." },
    { name:"Restore Limb", cost:4, verbal:"'Cure Maim or Cure All Maims'", description:"Spend 1 Attribute to 'Cure Maim'. If Centered, 'Cure All Maims' on the recipient.", attribute:"1 Insight" },
    { name:"Rejuvenate", cost:2, verbal:"'Imbue Long Rest'", description:"Once per event, if Centered, Imbue an ally a Long Rest." },
    { name:"Medic Station", cost:3, verbal:"N/A", description:"When Centered, First Aid is reduced to 30 seconds. Thread Skill.", attribute:"Thread Skill" },
    { name:"Protection", cost:4, verbal:"'Grant Guard Melee'", description:"Protect a companion from a melee attack. If Centered, Grant Guard Melee to two companions.", attribute:"1 Prowess" },
    { name:"Keep Ground", cost:4, verbal:"'By my Gesture Repel by <Trait>'", description:"While Centered, point at a foe and Repel them.", attribute:"1 Prowess" },
    { name:"Strong Center", cost:3, verbal:"N/A", description:"While Centered, when you use a skill granting multiple healing effects, gain one extra effect. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Inferno": [
    { name:"Blast of Flame", cost:0, verbal:"'3 Damage by Fire'", description:"Free. Spend 1 Attribute to gain two packet attacks of 3 Damage by Fire.", attribute:"1 Insight" },
    { name:"Fuel the Fire", cost:3, verbal:"N/A", description:"When you use a skill granting multiple damage packet effects, gain one extra effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Overdraft the Flame", cost:4, verbal:"'5 Damage by Fire'", description:"Once per Long Rest, spend 1 Fortitude for two packet attacks. Once per Long Rest, use the Surge skill.", attribute:"1 Fortitude" },
    { name:"Control the Elements", cost:3, verbal:"N/A", description:"Convert packet attacks to one additional element from the Elemental Trait Group. Switch between your original trait and the new element for all packet attacks." },
    { name:"Channel of Fire", cost:2, verbal:"'3 Damage by Fire'", description:"Once per event, gain 10 packet attacks of 3 damage by Fire. Also grants twice per event: call Surge and reset packet flurry." },
    { name:"Draw Heat", cost:4, verbal:"'Slow by Fire'", description:"Spend 1 Attribute and make a packet attack of 'Slow by Fire'.", attribute:"1 Insight" },
    { name:"Choking Smoke", cost:4, verbal:"'Silence by Fire'", description:"Spend 1 Attribute to make a packet attack of Fire to silence your foes.", attribute:"1 Fortitude" },
    { name:"Overwhelm", cost:2, verbal:"'8 Damage by Fire'", description:"Once per event, make a packet attack with a great conflagration of flame." },
  ],
  "Slayer": [
    { name:"Char the Flesh", cost:0, verbal:"'Agony by Fire'", description:"Free. Spend 1 Fortitude to make a packet attack of 'Agony by Fire'.", attribute:"1 Fortitude" },
    { name:"Immolate", cost:2, verbal:"'Death by Fire'", description:"Once per event, make a packet attack to burn your foes to death." },
    { name:"Bank the Flames", cost:2, verbal:"'Refresh Immolate to self'", description:"Once per event, after a Long Rest, restore your use of Immolate. Thread Skill.", attribute:"Thread Skill" },
    { name:"Fiery Bolt", cost:4, verbal:"'5 Damage by Fire'", description:"Spend 1 Prowess to make a packet attack of 5 damage by Fire.", attribute:"1 Prowess" },
    { name:"Nay to the Reaper", cost:4, verbal:"'Resist' and 'No Effect'", description:"Once per Long Rest, if hit by a death effect or death strike, call 'Resist death.' Remain immune to death strikes (not other death effects) until end of next Short Rest.", attribute:"1 Prowess" },
    { name:"Little Death", cost:4, verbal:"'Paralyze by Fear'", description:"Once per Short Rest, Paralyze foes with images of their pending demise. Spend 2 Fortitude and make a packet attack.", attribute:"2 Fortitude" },
    { name:"Death Curse", cost:2, verbal:"'Refresh Immolate to Self'", description:"If Immolate misses or is totally negated, refresh after Long Rest. Also: if you die and emerge from the gate of death, refresh one use of Immolate or Bank the Flames." },
    { name:"Death Washes Over", cost:4, verbal:"'Repel by Fear'", description:"Spend 1 Prowess to make a Packet attack to keep your foes at bay.", attribute:"1 Prowess" },
  ],
  "Bastion": [
    { name:"Well Fitted Armor", cost:0, verbal:"'Grant Guard Called Damage to self'", description:"Free. When you spend a minute to reset your armor, invoke a 'Guard versus melee damage.'", attribute:"1 Insight" },
    { name:"Fully Armored", cost:3, verbal:"N/A", description:"Your heavy armor is now worth 5 points." },
    { name:"Extra Armor", cost:3, verbal:"'Grant Parry Called Damage to Self'", description:"Well Fitted Armor now provides a Parry instead of a Guard. Thread Skill.", attribute:"Thread Skill" },
    { name:"Quick Fix", cost:4, verbal:"'Repair 3 Armor to Self'", description:"Place your hand on your torso and roleplay for 3 seconds to repair 3 points of armor.", attribute:"1 Fortitude" },
    { name:"Taking Time", cost:3, verbal:"N/A", description:"Once per Long Rest, use Well Fitted Armor at no Attribute cost. Thread Skill.", attribute:"Thread Skill" },
    { name:"Retake the Field", cost:2, verbal:"'Repair all armor'", description:"Once per event, repair all armor for yourself or a companion. On self, counts as spending a minute fixing armor." },
    { name:"Lockdown", cost:4, verbal:"'Grant 5 Protection and Slow to Self'", description:"Once per Short Rest, grant 5 Protection and Slow to self. When Protection is spent, Slow ends. (Slow is a physical effect and can be cured separately.)", attribute:"1 Insight" },
    { name:"Return the Blow", cost:4, verbal:"See description", description:"When hit by a damage attack of 5 or less and you take or resist it with a called defense, use that exact same attack against your attacker (same Trait).", attribute:"1 Fortitude" },
  ],
  "Defender": [
    { name:"Guard", cost:0, verbal:"'Grant Guard Melee to self'", description:"Free. Protect yourself from melee attacks by granting yourself a Guard.", attribute:"1 Fortitude" },
    { name:"Well Guarded", cost:3, verbal:"'Grant Extra Guard Melee to self'", description:"When you receive a Guard grant you can instead treat it as 'Grant Extra Melee Defense, Guard.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Parry", cost:4, verbal:"'Parry'", description:"Use this skill to Parry a melee blow.", attribute:"2 Fortitude" },
    { name:"Shrug It Off", cost:2, verbal:"'Reduce to 1 Damage'", description:"Once per event, reduce the next 3 called damage effects to 1 Damage each." },
    { name:"Just Tough", cost:4, verbal:"'Reduce to 2 Damage'", description:"Once per Short Rest, reduce the first called damage effect you take to 1 damage.", attribute:"1 Prowess" },
    { name:"Riposte", cost:4, verbal:"See description", description:"Once per Long Rest, when you completely negate a called melee damage effect, spend 1 Attribute to use that exact attack.", attribute:"1 Prowess" },
    { name:"Used to It", cost:2, verbal:"N/A", description:"Once per event, after being struck by a melee attack, reduce the cost of your Parry to 1 Fortitude for future attacks of that specific number or effect until Short Rest. Thread Skill.", attribute:"Thread Skill" },
    { name:"Once More into the Fray", cost:3, verbal:"'Refresh Used to It to self'", description:"Twice per event, after a Long Rest, refresh your use of 'Used to It.'" },
  ],
  "Dervish": [
    { name:"Flurry of Blows", cost:0, verbal:"'2 Damage'", description:"Free. Spend 1 Attribute to make two melee attacks of 2 damage.", attribute:"1 Fortitude" },
    { name:"Storm of Blows", cost:3, verbal:"N/A", description:"When you use a skill granting multiple melee attacks, gain one extra attack. Thread Skill.", attribute:"Thread Skill" },
    { name:"Painful Strike", cost:4, verbal:"'Agony'", description:"Strike a painful blow to your opponent.", attribute:"1 Prowess" },
    { name:"Follow Up Blow", cost:3, verbal:"'2 Damage'", description:"When you hit an opponent with Painful Strike and they take it without a defense, gain a '2 Damage' to use against them while they are under the Agony effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Strong Winds", cost:2, verbal:"N/A", description:"Once per event, melee attacks that cause 2 damage now cause 3 damage until your next Long Rest. Extra Thread Skill (breaks 3-thread-per-effect rule).", attribute:"Extra Thread Skill" },
    { name:"Restart the Storm", cost:4, verbal:"'Purge Maim'", description:"Roleplay for 3 seconds to Purge your own maimed limb.", attribute:"1 Fortitude" },
    { name:"Steady Blow", cost:4, verbal:"'6 Damage'", description:"Once per Long Rest, strike a powerful blow of 6 Damage.", attribute:"1 Prowess" },
    { name:"Drive Back the Attackers", cost:4, verbal:"'Disengage'", description:"Once per Short Rest, give yourself and allies a moment of calm on the battlefield by calling Disengage.", attribute:"1 Fortitude" },
  ],
  "Hurricane": [
    { name:"Strong Strike", cost:0, verbal:"'5 Damage'", description:"Free. Melee attack for 5 Damage.", attribute:"1 Fortitude" },
    { name:"Stunning Blow", cost:2, verbal:"'Stun'", description:"Once per event, when wielding a two-handed weapon with a single striking surface, strike an opponent with a melee 'Stun' attack." },
    { name:"Rest Up for Another Blow", cost:2, verbal:"'Refresh Stunning Blow to Self'", description:"Once per event, after a Long Rest in a Place of Peace, refresh your use of Stunning Blow." },
    { name:"Disabling Strike", cost:4, verbal:"'Maim'", description:"Make a melee attack of 'Maim.'", attribute:"1 Prowess" },
    { name:"Crushing Blow", cost:4, verbal:"'10 Damage'", description:"Once per Long Rest, when wielding a two-handed weapon with a single striking surface, make a melee attack for 10 damage.", attribute:"1 Fortitude" },
    { name:"No Stopping the Storm", cost:4, verbal:"'Resist'", description:"Resist an effect of either Weakness or Frenzy.", attribute:"1 Prowess" },
    { name:"Complex Fracture", cost:3, verbal:"See Description", description:"When wielding a two-handed weapon with a single striking surface, your melee 'Maim' attacks are 'Double Maim.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Storm's Fury", cost:3, verbal:"'5 Damage'", description:"Once per Short Rest, when your foe falls after a melee damage attack you made, gain a melee 5 Damage attack. Lost if you make any other called attack first." },
  ],
  "Tempest": [
    { name:"Deadly Strike", cost:0, verbal:"'Death'", description:"Free. Melee Death. 1x per event.", attribute:"1x event" },
    { name:"Refocus", cost:3, verbal:"N/A", description:"After taking a Long Rest, refresh your use of Deadly Strike.", attribute:"1x/event" },
    { name:"Painful Strike", cost:3, verbal:"'Agony'", description:"Agony melee attack.", attribute:"1 Insight" },
    { name:"Quick Strike", cost:4, verbal:"'4 Damage'", description:"Melee attack for 4 Damage.", attribute:"1 Prowess" },
    { name:"A Little Bit More", cost:4, verbal:"'5 Damage'", description:"When your death effect is negated by a called defense, gain a melee attack of 5 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"The Little Death", cost:2, verbal:"'Short Weakness'", description:"Melee attack for Short Weakness.", attribute:"1 Insight" },
    { name:"Touch Death", cost:4, verbal:"N/A", description:"If you die and have the 'Dead' condition, and you receive a Cure Death effect, you refresh a use of the skill Deadly Strike.", attribute:"At will" },
    { name:"Seeing Another's Time", cost:3, verbal:"N/A", description:"During a Short Rest, study a single opponent; your damage melee attacks against them from any source are +2 damage. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Awakener": [
    { name:"Restore the Dying", cost:0, verbal:"'Cure Death by Water'", description:"Free. 1x/event, make a touch packet to Cure Death." },
    { name:"A Second Chance", cost:2, verbal:"See description", description:"1x/event, after a Long Rest in a Place of Peace, refresh 'Restore the Dying.' Additionally, when you use 'Restore the Dying,' the effect is now 'Cure Death and Heal 5 by Water.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Awaken the Afflicted", cost:3, verbal:"'Cure Metabolic by Water'", description:"Restore those affected by maladies of the body.", attribute:"1 Prowess" },
    { name:"Lifegiving Healing", cost:3, verbal:"N/A", description:"Your healing effects from Awakener are increased by 2. Thread Skill.", attribute:"Thread Skill" },
    { name:"Shield of Preservation", cost:4, verbal:"'Grant Guard Physical by Water'", description:"Provide a protection against physical harm to your allies.", attribute:"1 Fortitude" },
    { name:"Nay to the Reaper", cost:4, verbal:"'Resist Death'", description:"Once per Long Rest, if hit by a death effect or death strike, call 'Resist death.' Immune to death strikes (not other death effects) until end of next Short Rest.", attribute:"1 Fortitude" },
    { name:"Restore the Living", cost:4, verbal:"'Heal 4 by Water'", description:"Heal those with injuries.", attribute:"1 Prowess" },
    { name:"Prevent Death", cost:2, verbal:"'Stabilize by Water'", description:"At will, stabilize those who are unstable. Beneficial touch packet." },
  ],
  "Wellspring": [
    { name:"Heal the World", cost:0, verbal:"'Heal 2 by Water'", description:"Free. Gain 3 Heal 2 effects, each must go to a different person. Second invocation discards unused effects.", attribute:"1 Prowess" },
    { name:"Spread the Healing", cost:3, verbal:"N/A", description:"Gain 2 additional heal effects with Heal the World, and 2 additional protection effects with Protect the Line. Thread Skill.", attribute:"Thread Skill" },
    { name:"Balm to War", cost:3, verbal:"'Cure Physical by Magic'", description:"Undo afflictions caused by weapons of war and similar physical effects.", attribute:"1 Insight" },
    { name:"Heroic Healing", cost:2, verbal:"'By your name <n> Heal 4 by Water'", description:"Once per event, heal someone by their name. Thread Skill.", attribute:"Thread Skill" },
    { name:"Skillful Medic", cost:4, verbal:"See Description", description:"When you complete First Aid on a fallen individual, provide them with a point of healing. If using Earth's Determination, heal for an additional point. Thread Skill.", attribute:"Thread Skill" },
    { name:"Protect the Line", cost:4, verbal:"'Grant 2 Protection by Water'", description:"Gain two 'Grant 2 Protection' effects that must be used on different people.", attribute:"1 Insight" },
    { name:"If You Fall the Line Falls", cost:4, verbal:"'Spirit'", description:"Once per Long Rest, turn to Spirit for up to one minute (arms crossed over torso). End at any time with 'Cure Spirit to Self.'", attribute:"1 Prowess" },
    { name:"All Is Not Lost", cost:3, verbal:"'Refresh to self'", description:"If someone attacks a downed person you just healed, spend 10 seconds of Focus to regain that effect. Cannot regain more than one lost effect this way; resets to lost after Short or Long Rest." },
  ],
  "Alchemist": [
    { name:"Craft Elixirs", cost:0, verbal:"N/A", description:"Free. Craft alchemical elixirs (healing and curative). Each has a unique cost in coin/components. Spend on creation.", attribute:"See formula" },
    { name:"Craft Volatiles", cost:4, verbal:"N/A", description:"Craft alchemical volatiles (damage and detrimental effects).", attribute:"See formula" },
    { name:"Tinged with Poison", cost:3, verbal:"'By Poison'", description:"Convert your non-beneficial packet attacks to 'By Poison'. Thread Skill.", attribute:"Thread Skill" },
    { name:"Volley of Poison", cost:4, verbal:"'2 Damage by Poison'", description:"Gain two packet attacks of 2 Damage by Poison.", attribute:"1 Prowess" },
    { name:"Bottled Healing", cost:4, verbal:"'Heal 2 by Alchemy'", description:"Gain two uses of Heal 2 by Alchemy. Twice per event, create any elixir/volatile in 10 seconds.", attribute:"1 Fortitude" },
    { name:"On the Fly Alchemy", cost:2, verbal:"'By Alchemy, Grant <effect>'", description:"Seconds and create any elixir or volatile on the field, away from an alchemy lab." },
    { name:"Regain Substance", cost:3, verbal:"'Refresh Alchemy'", description:"Once per Long Rest, if you missed or had a volatile negated, spend 1 minute to recreate it. Once per substance." },
    { name:"Curative Mixture", cost:4, verbal:"'Cure Metabolic'", description:"Cure the body of poison, disease, and other ills.", attribute:"1 Prowess" },
  ],
  "Arcaneer": [
    { name:"Harness Fire", cost:0, verbal:"N/A", description:"Free. Create Fire Arcaneering engines at an elemental node. Gain Arcaneering as a spellcasting method. Also create Air Arcaneering engines.", attribute:"See Formula" },
    { name:"Harness Air", cost:4, verbal:"N/A", description:"Create Air Arcaneering engines at an elemental node.", attribute:"See Formula" },
    { name:"Harness Water", cost:4, verbal:"N/A", description:"Create Water Arcaneering engines at an elemental node.", attribute:"See Formula" },
    { name:"Harness Earth", cost:4, verbal:"N/A", description:"Create Earth and Ice Arcaneering engines at an elemental node.", attribute:"See Formula" },
    { name:"Harness Ice", cost:4, verbal:"N/A", description:"Create Ice Arcaneering engines at an elemental node.", attribute:"See Formula" },
    { name:"Harness Lightning", cost:4, verbal:"N/A", description:"Create Lightning Arcaneering engines at an elemental node.", attribute:"See Formula" },
    { name:"Elemental Surge", cost:4, verbal:"'4 Damage by <Element>'", description:"Channel a 4-damage packet or melee attack of any element you can harness.", attribute:"1 Prowess" },
    { name:"Elemental Repair", cost:4, verbal:"'Repair 3 armor by <Element>'", description:"Instantly Repair 3 points of Armor on yourself or another.", attribute:"1 Insight" },
    { name:"Elemental Control", cost:3, verbal:"'By Elemental Power'", description:"3x per event, convert a Damage or Agony effect to the 'Elemental Power' Trait. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Armorsmith": [
    { name:"Battlefield Repair", cost:0, verbal:"'Repair 1 Armor'", description:"Free. For each use of this Skill, gain two uses of 'Repair 2 Armor.'", attribute:"1 Insight" },
    { name:"Adjust Armor", cost:4, verbal:"'Grant 1 Protection'", description:"Gain two uses of 'Grant 2 Protection.'", attribute:"1 Prowess" },
    { name:"Ringing Hammer", cost:3, verbal:"N/A", description:"When using a Repair Armor or Grant Protection Skill with multiple uses while Centered, Increase the number of uses by 2. Thread Skill.", attribute:"Thread Skill" },
    { name:"Heat the Forge", cost:3, verbal:"N/A", description:"The first Repair Armor or Grant Protection you use after Centering has its effect increased by 2. Thread Skill.", attribute:"Thread Skill" },
    { name:"Stir the Embers", cost:3, verbal:"N/A", description:"Once per Long Rest, the next skill you use after losing your Centering can still count as being Centered." },
    { name:"Full Repair", cost:2, verbal:"N/A", description:"Once per event, Repair all armor for yourself or another. Use a second time during the event only while Centered." },
    { name:"Repair Weapon", cost:2, verbal:"'Repair Weapon'", description:"While Centered, take 10 seconds of roleplay to fix a destroyed weapon." },
    { name:"Well Fit Armor", cost:3, verbal:"N/A", description:"When you are Centered, your Armor gains an additional point." },
  ],
  "Beguiler": [
    { name:"Guard versus Weapons", cost:0, verbal:"'Grant Physical Defense to Self, Guard'", description:"Free. Provide yourself with a Guard versus physical effects.", attribute:"1 Insight" },
    { name:"Guard versus Elements", cost:4, verbal:"'Grant Elemental Defense to Self, Guard'", description:"Provide yourself with a Guard versus the elements.", attribute:"1 Insight" },
    { name:"Guard versus Ailments", cost:4, verbal:"'Grant Metabolic Defense to Self, Guard'", description:"Provide yourself with a Guard versus metabolic effects.", attribute:"1 Fortitude" },
    { name:"Reverse Protection", cost:3, verbal:"'4 Damage by <see description>'", description:"If you have a Guard active, expend it to make a 4-damage packet attack. Trait depends on Guard type (Elemental→Fire or Ice; Metabolic→Poison or Disease; Physical→Force; Mental→Will or Gloom)." },
    { name:"Empowered Defense", cost:3, verbal:"N/A", description:"If you have an active Guard and use a damage packet of the same Trait Group, Increase the damage by 1. Thread Skill.", attribute:"Thread Skill" },
    { name:"Absorb Attack", cost:2, verbal:"'Absorb to Heal X'", description:"Twice per event, if you have a Guard active against a damage attack, absorb the damage effect for a heal effect equal to the damage." },
    { name:"Share Protection", cost:3, verbal:"'Grant Guard <type>'", description:"Once per Short Rest, when you use a 'Grant Guard' on yourself from this Excellency, also provide one to an ally." },
    { name:"Banish Foe", cost:4, verbal:"'Repel by Fire or Ice'", description:"Repel a foe by melee or packet.", attribute:"1 Fortitude" },
  ],
  "Bladesmith": [
    { name:"Hand Out Weapons", cost:0, verbal:"'Grant Melee Attack 2 Damage'", description:"Free. Gain one use of 'Grant Melee Attack 3 Damage.'", attribute:"1 Insight" },
    { name:"Sharpen the Blade on the Forge", cost:3, verbal:"N/A", description:"If Centered, when you use a melee attack Grant damage effect, Increase the damage by 1. Thread Skill.", attribute:"Thread Skill" },
    { name:"Arm the Line", cost:3, verbal:"N/A", description:"If Centered and using 'Hand Out Weapons,' 'Dire Blades,' or 'Blade of Last Resort,' Grant an additional effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Dire Blades", cost:4, verbal:"'Grant Melee Attack Agony'", description:"Sharpen someone's blade so they cause extra pain when they strike.", attribute:"1 Fortitude" },
    { name:"Stir the Embers", cost:3, verbal:"N/A", description:"Once per Short Rest, the next Skill you use after losing your Centering can still count as Centered." },
    { name:"Load Them Down", cost:3, verbal:"N/A", description:"Twice per Long Rest, 'Grant Extra' when using 'Hand Out Weapons,' 'Dire Blades,' or 'Blade of Last Resort.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Blade of Last Resort", cost:2, verbal:"'Triple Grant melee attack 5 damage'", description:"Once per event, give someone three attacks of 5 damage to use in a flurry or clear their path." },
    { name:"Hardened Steel", cost:4, verbal:"'Grant Resist Destroy'", description:"Gain two uses of 'Grant Resist Destroy.' Also gain the ability to spend 1 minute of roleplay to repair a weapon.", attribute:"1 Insight" },
  ],
  "Combatant": [
    { name:"Simple Strike", cost:0, verbal:"N/A", description:"Free. Make a 4 damage melee attack.", attribute:"1 Prowess" },
    { name:"Parry", cost:4, verbal:"'Parry'", description:"Negate a melee attack made against you.", attribute:"2 Fortitude" },
    { name:"Weapon Style Prowess", cost:3, verbal:"N/A", description:"Fight with a basic one-handed melee weapon and any of: Buckler, Shield, another one-handed weapon, staff, or spear." },
    { name:"Armored for War", cost:4, verbal:"N/A", description:"Wear heavy armor. Prerequisite: medium armor. Thread Skill.", attribute:"Thread Skill" },
    { name:"Reset the Field", cost:4, verbal:"'Disengage'", description:"Once per Short Rest, clear the field around you.", attribute:"1 Prowess" },
    { name:"Take Ground", cost:4, verbal:"'5 Damage' and 'Grant Guard to self'", description:"Once per Long Rest, make a melee attack for 5 Damage. If the recipient acknowledges, gain a Guard versus melee attacks.", attribute:"1 Fortitude" },
    { name:"Turn the Tide of Battle", cost:2, verbal:"'8 Damage' or 'Parry'", description:"Twice per event, make a melee attack for 8 Damage or use a Parry effect." },
    { name:"Turn the Blade", cost:3, verbal:"'3 Damage'", description:"When you Parry an attack against you, gain a 3-damage attack. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Devastator": [
    { name:"Caster's Companion", cost:0, verbal:"N/A", description:"Free. Wield a single basic one-handed weapon while making packet attacks from your other hand." },
    { name:"Channel Sparks", cost:4, verbal:"'2 Damage by Fire'", description:"Gain two attacks of '2 Damage by Fire' as packet or melee.", attribute:"1 Fortitude" },
    { name:"Hand of Magics", cost:3, verbal:"N/A", description:"If you've had only a single one-handed weapon or packets since your last Short Rest, Packet attacks of 2 or greater are +1 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"Hand of Steel", cost:3, verbal:"N/A", description:"If you've had only a single one-handed weapon or packets since your last Short Rest, Melee attacks of 2 or greater are +1 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"Summon to Your Blade", cost:3, verbal:"N/A", description:"Once per Long Rest, if you throw a packet and miss, convert that spell to a melee attack at no additional cost. Lost if you make another called attack first or take a Long Rest." },
    { name:"Channel Will", cost:4, verbal:"'Agony by Will'", description:"Make an 'Agony by Will' attack by packet or melee.", attribute:"1 Prowess" },
    { name:"Channel Flames", cost:4, verbal:"'Short Destroy by Fire'", description:"Spend 1 Attribute to make a Short Destroy attack by packet or melee.", attribute:"1 Fortitude" },
    { name:"Channel Storm", cost:2, verbal:"'6 Damage by Wind'", description:"Three times per event, make a melee or packet attack of 6 damage by Wind." },
  ],
  "Grenadier": [
    { name:"Lightning Ammunition", cost:0, verbal:"'5 Damage by Lightning' or 'Weakness by Lightning'", description:"Free. Shocker: spend 1 Attribute for 1 packet attack of 5 damage. OR Stunner: spend 1 Attribute for 1 packet attack of Weakness.", attribute:"1 Insight" },
    { name:"Fire Ammunition", cost:4, verbal:"'3 damage by Fire' or 'Agony by Fire'", description:"Flamethrower: spend 1 Attribute for 2 packet attacks of 3 damage. OR Burn: spend 1 Attribute for 1 packet attack of Agony.", attribute:"1 Prowess" },
    { name:"Earth Ammunition", cost:4, verbal:"'2 damage by Earth' or 'Maim by Earth'", description:"Shardthrower: spend 1 Attribute for 4 packet attacks of 2 damage. OR Shatter: spend 1 Attribute for 1 packet attack of Maim.", attribute:"1 Insight" },
    { name:"Ice Ammunition", cost:4, verbal:"'Slow by Ice' or 'Short Paralyze by Ice'", description:"Icy Surface: spend 1 Attribute for a packet attack of Slow. OR Shatter: spend 1 Attribute for 1 packet attack of Short Paralyze.", attribute:"1 Prowess" },
    { name:"Double Barrel", cost:3, verbal:"N/A", description:"Have two ammunition types active at once. Choose which two at the start of the event. Switch one or both after a minute of roleplay during the event." },
    { name:"Shift Loads", cost:2, verbal:"'Imbue <Element> to self'", description:"Spend 1 Attribute to instantly change one active Elemental Ammunition without roleplay. Once per Long Rest, call Surge and refresh your packet Flurry.", attribute:"1 Prowess" },
    { name:"Twisted Projector", cost:2, verbal:"N/A", description:"Once per event, use the effects of one Elemental Ammunition you know with the Trait of another you also know. Ends at end of next Long Rest." },
    { name:"Well-made Device", cost:3, verbal:"'No Effect' or 'Reduce to short destroy'", description:"Your Projector is immune to disarm or reduces destroy to short destroy. Twice per Long Rest, refresh your quiver with 10 seconds of Rest." },
  ],
  "Naturalist": [
    { name:"Thorn Arrow", cost:0, verbal:"'4 Damage by Thorns'", description:"Free. Make a '4 Damage by Thorns' missile attack with a bow or crossbow.", attribute:"1 Fortitude" },
    { name:"Wild Fletching", cost:3, verbal:"N/A", description:"Your called damage missile attacks (archery only) do damage by Thorns; +1 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"Curative Bolt", cost:3, verbal:"N/A", description:"Use arrows to cast healing or cure effects. If you miss with a healing packet, spend 10 seconds to regain the effect. If you use another skill before Resting, the missed one is lost." },
    { name:"Shade of the Forest", cost:3, verbal:"N/A", description:"Your healing effects by 'Salve' are +1. Thread Skill.", attribute:"Thread Skill" },
    { name:"Healing Ointment", cost:4, verbal:"'Heal 4 by Salve'", description:"Create a natural salve to Heal yourself or companions.", attribute:"1 Insight" },
    { name:"Call Forth the Forest", cost:2, verbal:"See description", description:"Once per event, call upon the strength of the forest: gain 10 effects of 'Heal 3 by Salve,' 'Cure Slow by Salve,' or arrows of '3 Damage by Thorns.'" },
    { name:"Living Bow", cost:3, verbal:"'Resist'", description:"After a Long Rest, your bow is enchanted and can resist the first two strikes that would require restringing. Once per Long Rest, if you can touch a tree, refresh your quiver with 10 seconds of Rest." },
    { name:"Nature's Touch", cost:4, verbal:"'6 Damage by Thorns'", description:"Once per Short Rest, touch a tree and gain a special missile attack of '6 Damage by Thorns.'", attribute:"1 Fortitude" },
  ],
  "Ordinator": [
    { name:"Continuous Healing", cost:0, verbal:"'Heal 2 by Water'", description:"Free. When Centered, spend 1 Attribute for one Heal 2. Refresh twice with 10 seconds of roleplay.", attribute:"1 Insight" },
    { name:"Extended Healing", cost:3, verbal:"N/A", description:"Gain two additional refreshes for Continuous Protection and Continuous Healing. Can be purchased twice (total +4 refreshes). Thread Skill.", attribute:"Thread Skill" },
    { name:"Continuous Protection", cost:4, verbal:"'Grant 2 Protection by Water'", description:"When Centered, spend 1 Attribute to 'Grant 2 Protection.' Refresh once with 10 seconds of roleplay.", attribute:"1 Fortitude" },
    { name:"Instantaneous Casting", cost:2, verbal:"'Imbue by Earth'", description:"Twice per event, forego the roleplay requirement to refresh a skill." },
    { name:"Instantaneous Centering", cost:4, verbal:"'Grant [Centered]'", description:"Once per Long Rest, spend 1 Attribute to be instantly Centered.", attribute:"1 Insight" },
    { name:"Stand Firm against the Flow", cost:3, verbal:"'Heal all to self'", description:"When you restore your Centering, spend 1 Attribute to 'Heal all to self.'", attribute:"1 Fortitude" },
    { name:"Greater Healing", cost:3, verbal:"N/A", description:"Once per Long Rest, Increase the effect of Continuous Healing by 3. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Paladin": [
    { name:"Shield of Protection", cost:0, verbal:"N/A", description:"Free. When casting beneficial effects, you may have a shield on your arm, or a shield and one-handed weapon tucked beneath the shield arm." },
    { name:"Share the Bounty", cost:4, verbal:"'Heal 2 by Water'", description:"Gain one packet effect usable only on yourself and one only on another. Second invocation discards unused effects from the first.", attribute:"1 Prowess" },
    { name:"Overflowing Bounty", cost:3, verbal:"N/A", description:"When you use 'Share the Bounty,' gain a second packet healing effect to use on someone else. Thread Skill.", attribute:"Thread Skill" },
    { name:"Companion Blessing", cost:2, verbal:"'By your name <n> Heal'", description:"3 times per event, Heal an ally by their name." },
    { name:"Restore Limb", cost:4, verbal:"'Cure Maim by Water'", description:"Use a touch packet to cure a Maim.", attribute:"1 Fortitude" },
    { name:"Free the Entrapped", cost:4, verbal:"'Cure Root by Water'", description:"Use a touch packet to cure a Root.", attribute:"1 Prowess" },
    { name:"Protection from Blades", cost:4, verbal:"'Grant Guard Physical'", description:"Once per Short Rest, Grant a 'Guard Physical' to yourself and a second 'Guard Physical' to another.", attribute:"1 Fortitude" },
    { name:"Greater Healing", cost:3, verbal:"'Heal 5 by Water'", description:"Once per Long Rest, Increase the effect of Share the Bounty to a 'Heal 5 by Water.' Thread Skill.", attribute:"Thread Skill" },
  ],
  "Poison Blade": [
    { name:"Craft Blade Venoms", cost:0, verbal:"N/A", description:"Free. Craft alchemical venoms (blade and missile). Each has a unique cost in coin, components and/or attributes. Spend on crafting.", attribute:"See Formula" },
    { name:"Craft Elixirs", cost:4, verbal:"N/A", description:"Craft alchemical elixirs (healing and curative). Spend requirements on crafting.", attribute:"See Formula" },
    { name:"Quick Toxin", cost:4, verbal:"'Grant Melee Attack to self, 5 Damage by Poison'", description:"Mix a quick poison attack to affix to your blade.", attribute:"1 Prowess" },
    { name:"Lingering Venom", cost:3, verbal:"'…by Poison'", description:"Your weapon has a lingering toxin; convert all melee attacks to 'by Poison.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Healing Venom", cost:3, verbal:"N/A", description:"Your crafted elixirs and healing skills from this header are +1 in effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Quick Elixir", cost:4, verbal:"'Grant Touch Packet to self, Heal 4 by Alchemy'", description:"Quickly put together a healing elixir to heal yourself or companions.", attribute:"1 Insight" },
    { name:"Metabolize", cost:4, verbal:"'Purge Metabolic'", description:"Twice per event, cast off a metabolic effect by your exposure to toxic substances." },
    { name:"Poison Blood", cost:3, verbal:"'Absorb and Heal 2 to self'", description:"Once per Short Rest, if affected by a Poison effect, absorb it and 'Heal 2 Damage' instead." },
  ],
  "Retributor": [
    { name:"Strike First", cost:0, verbal:"'4 Damage'", description:"Free. Make a missile attack for 4 damage.", attribute:"1 Fortitude" },
    { name:"Bloody Arrow", cost:3, verbal:"N/A", description:"When you take Vitality damage, your next called damage missile attack is +2 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"Capture Momentum", cost:4, verbal:"See Description", description:"Twice per Long Rest, when struck by a damage attack, store it and return it as a missile attack (just calling the damage, not the trait) as your next attack. Lost if you make another attack first.", attribute:"1 Insight" },
    { name:"Fit Combatant", cost:3, verbal:"N/A", description:"You have +1 Vitality when wielding a bow." },
    { name:"Healthy", cost:3, verbal:"N/A", description:"Gain +2 to the first healing spell or Skill you use after a Short Rest. Thread Skill.", attribute:"Thread Skill" },
    { name:"Return to the Fray", cost:4, verbal:"'Heal 3 to self by Ice'", description:"Take a moment to heal your own wounds.", attribute:"1 Fortitude" },
    { name:"Cost of Blood", cost:2, verbal:"'Short Weakness'", description:"Once per Short Rest, make an archery attack of Short Weakness and, once it lands and is acknowledged, Short Weakness to self." },
    { name:"Duel Ender", cost:4, verbal:"'Reflect'", description:"Once per event, reflect a missile attack." },
  ],
  "Sirocco": [
    { name:"Dual Arrows", cost:0, verbal:"'3 Damage'", description:"Free. Make a missile attack for 3 damage.", attribute:"1 Insight" },
    { name:"Ready to Fire", cost:3, verbal:"N/A", description:"When Centered, get an extra attack for any of 'Dual Arrows,' 'Serrated Arrow,' 'Piercing Arrow,' or 'Bullseye.' Thread Skill.", attribute:"Thread Skill" },
    { name:"Set Your Feet", cost:3, verbal:"N/A", description:"While Centered, called damage archery attacks do +1 damage. Thread Skill.", attribute:"Thread Skill" },
    { name:"Serrated Arrow", cost:4, verbal:"'Agony'", description:"Shoot an arrow to cause pain. Counts as multiple attacks for Thread Skills granting additional attacks.", attribute:"1 Prowess" },
    { name:"Piercing Arrow", cost:4, verbal:"'5 Damage'", description:"Once per Long Rest, make a damaging archery attack. Counts as multiple attacks for Thread Skills.", attribute:"1 Insight" },
    { name:"Bullseye", cost:2, verbal:"'8 Damage'", description:"Once per event, make a large attack. Counts as multiple attacks for Thread Skills." },
    { name:"Instant Fletching", cost:4, verbal:"'Refresh Quiver'", description:"If Centered, spend 1 Attribute to immediately refresh your quiver.", attribute:"1 Prowess" },
    { name:"Instant Restring", cost:3, verbal:"'Restring bow'", description:"Once per Short Rest, if Centered, instantly restring your bow. May be done in combat." },
  ],
  "Tinkerer": [
    { name:"Craft Armament", cost:0, verbal:"N/A", description:"Free. Craft Armaments (damage via projectiles). Unique cost in gold, components, and/or Attributes. Spend on creation.", attribute:"See Formula" },
    { name:"Craft Defensive Implement", cost:4, verbal:"N/A", description:"Craft Defensive Implements (protect from damage and effects). Spend requirements on creation.", attribute:"See Formula" },
    { name:"Craft Utility Device", cost:4, verbal:"N/A", description:"Craft Utility Devices (opening locks, holding doors, crossing pits, etc.). Spend requirements on creation.", attribute:"See Formula" },
    { name:"Craft Weapon Enhancement", cost:4, verbal:"N/A", description:"Craft Weapon Enhancements that improve bows and crossbows.", attribute:"See Formula" },
    { name:"Skilled Craftsmanship", cost:3, verbal:"N/A", description:"Damage effects you create with Tinkering are increased by 1. Thread Skill.", attribute:"Thread Skill" },
    { name:"Makeshift Creation", cost:2, verbal:"'Imbue by'", description:"Twice per event, create a tinkered device on the field without coin or attributes. Cannot be given to another; fails at next Long Rest." },
    { name:"Get the Most Out of It", cost:3, verbal:"N/A", description:"Once per Short Rest, when you use a tinkered device with multiple uses, gain an additional effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Just Use Anything", cost:3, verbal:"'Resist'", description:"Once per Long Rest, when hit by a melee, missile, or packet attack, expend a charge from a tinkered item to Resist the effect.", attribute:"Expend 1 tinkered item" },
  ],
  "Tornado": [
    { name:"Bow and Sword", cost:0, verbal:"N/A", description:"Free. Fight with an offensive one-handed weapon and use a bow to block in your other hand. All skills can be melee or missile. Prerequisite: Archery skill." },
    { name:"Simple Strike", cost:4, verbal:"'4 Damage'", description:"Attack your foes with a basic attack.", attribute:"1 Prowess" },
    { name:"Specialized in Bow and Sword", cost:3, verbal:"N/A", description:"When wielding both a one-handed weapon and a Bow, gain +1 damage to all melee attacks. Thread Skill.", attribute:"Thread Skill" },
    { name:"Flowing Strikes", cost:4, verbal:"'2 Damage'", description:"Spend 1 Attribute to gain three '2 Damage' attacks.", attribute:"1 Fortitude" },
    { name:"Subduing Blow", cost:4, verbal:"'Agony'", description:"Spend 1 Attribute to gain an attack of Agony.", attribute:"1 Prowess" },
    { name:"Ready to Fire", cost:4, verbal:"'Refresh Quiver'", description:"Once per Short Rest, spend 10 seconds of Rest to refresh your quiver. Thread Skill.", attribute:"Thread Skill" },
    { name:"Strike True", cost:2, verbal:"'8 Damage'", description:"Once per event, make an attack for 8 damage." },
    { name:"Crushing Strike", cost:4, verbal:"'Short Destroy Weapon'", description:"Once per Long Rest, make an attack for Short Destroy.", attribute:"1 Fortitude" },
  ],
  "Volcano": [
    { name:"Lava Burst", cost:0, verbal:"'Grant Packet Attack 2/4 Damage by Fire'", description:"Free. Grant a fiery packet attack to yourself or companions. When Centered, the strength doubles to 4 damage.", attribute:"1 Insight" },
    { name:"Lava Blade", cost:4, verbal:"'Grant Melee Attack 2/4 Damage by Fire'", description:"Grant a fiery melee attack to yourself or companions. When Centered, the strength doubles.", attribute:"1 Prowess" },
    { name:"Lava Shard", cost:4, verbal:"'Grant Missile Attack 2/4 Damage by Fire'", description:"Grant a fiery missile attack to yourself or companions. When Centered, the strength doubles.", attribute:"1 Insight" },
    { name:"Lava Flows", cost:3, verbal:"N/A", description:"When you use a packet attack from a Grant effect, apply Thread Skills as if it were a skill. If you miss with a Grant packet and are Centered, expend your Center to regain it — must use it as your next called attack. Thread Skill.", attribute:"Thread Skill" },
    { name:"Refocus", cost:3, verbal:"N/A", description:"If you miss with a packet attack and are Centered, expend your Center to regain it. Must use as your next called attack or it is lost." },
    { name:"Hardened Lava", cost:3, verbal:"'Root by Earth'", description:"Spend 1 Prowess to cast a Root effect.", attribute:"1 Prowess" },
    { name:"Barrage of Lava", cost:2, verbal:"'Grant Packet Attack, 5 Damage by Fire'", description:"Once per event, gain 4 uses of 'Grant Packet Attacks, 5 Damage by Fire.'" },
    { name:"Split Lava Flow", cost:3, verbal:"See description", description:"Once per Long Rest, when you Grant an attack to yourself, give the same Grant to an ally. Thread Skill.", attribute:"Thread Skill" },
  ],
};

const EXPRESSIONS = [
  "Aspected","Cultural Expertise","Empowered Aspect","Far Traveler",
  "Foreseer","Fortune Teller","Heartbinder","Oracle","Performer",
  "Prodigy","Remembrancer","Savant","Songsmith","Strategist","Virtuoso",
];

const EXPRESSION_SKILLS: Record<string, SkillDef[]> = {
  "Aspected": [
    { name:"Third Aspect", cost:0, verbal:"See Description", description:"Free. Choose a 3rd Aspect. Gain one ability usable via any of your three Aspect Traits: Bane (5 Damage Packet/Melee/Missile, 1 Fortitude), Balm (Heal 5 touch packet, 1 Fortitude), or Repulse (Repel Packet/Melee/Missile attack, 1 attribute). Grants a Third Aspect selector on the Background tab.", attribute:"1 Fortitude" },
    { name:"Gather Aspect", cost:4, verbal:"'Heal All by <trait>'", description:"Once per Long Rest, when presented with a source of any of your aspects, spend 10 seconds of rest at the source and restore all your Vitality." },
    { name:"Commune with Aspects", cost:2, verbal:"N/A", description:"Once per event, after taking a Long Rest you can refresh a single 1x/event skill you used." },
    { name:"Aspect Versatility", cost:0, verbal:"N/A", description:"Free. Purchase up to 3 additional abilities from your available Aspect skill list." },
  ],
  "Cultural Expertise": [
    { name:"Garb", cost:0, verbal:"N/A", description:"Free. When you dress in the style of your culture you gain +1 point of value for the armor type you are wearing." },
    { name:"Bringing the Good Word of the Country", cost:3, verbal:"N/A", description:"You may use your culture as your beneficial trait for effects. When you use your culture as your beneficial trait for healing effects, they are increased by 1. Thread Skill.", attribute:"Thread Skill" },
    { name:"The Ties That Bind", cost:4, verbal:"N/A", description:"1x/Long Rest, turn to spirit and go directly to someone you can see who you know to be the same culture as you.", attribute:"1 Prowess" },
    { name:"Cultural Versatility", cost:0, verbal:"N/A", description:"Free. Purchase up to 3 additional abilities from your available cultural skill list." },
  ],
  "Empowered Aspect": [
    { name:"Channel Aspect", cost:0, verbal:"N/A", description:"Free. Choose Benign or Malevolent. Benign: convert all Beneficial effects to your Chosen Aspect Trait, +1 to healing or repair armor from Domain skills by that Trait. Malevolent: convert all non-beneficial called effects to your Chosen Aspect Trait, +1 to damage from Domain skills by that Trait. Thread Skill.", attribute:"Thread Skill" },
    { name:"Greater Aspect Weapons", cost:4, verbal:"N/A", description:"Gain the Aspect weapon skill of one of your Aspects. Your Aspect weapons are immune to Destroy and Disarm effects." },
    { name:"Greater Aspect Attack", cost:4, verbal:"'6 damage by [Trait]'", description:"Choose Melee, Missile, or Packet. Spend one attribute to make that attack for 6 damage by your Chosen Aspect Trait.", attribute:"1 Prowess" },
    { name:"Greater Aspect Balm", cost:4, verbal:"See Description", description:"You can 'Absorb to Heal 2', 'Cure', or 'Purge' an effect by your Chosen Aspect Trait.", attribute:"1 Fortitude" },
  ],
  "Far Traveler": [
    { name:"Dual Citizenship", cost:0, verbal:"See Description", description:"Free. Select a second culture, gain its trait, and may purchase its skills. Spend 1 Fortitude and use a touch packet of 'Grant (melee/missile/packet) attack to Culture 5 Damage by Presence'.", attribute:"1 Fortitude" },
    { name:"Multinational", cost:4, verbal:"See Description", description:"Select a third culture, gain its trait, and may purchase its skills. Once per event: touch packet 'Cure Death to [Culture]'." },
    { name:"Spreading Appreciation", cost:4, verbal:"'Grant <attack> 4 damage by Will'", description:"Perform an action exemplifying a culture you belong to, then grant an attack (melee, missile, or magic) to yourself or another.", attribute:"1 Insight" },
    { name:"Hardy Traveler", cost:3, verbal:"N/A", description:"Gain +1 point to one attribute of your choice (Prowess, Fortitude, or Insight)." },
  ],
  "Fortune Teller": [
    { name:"Prophecy", cost:0, verbal:"See skill description", description:"Free. Do a reading in a Place of Peace. Choose one grant: (1) Grant 2 Protection by Trance to target and self, (2) Grant Melee Attack 2 Damage to target and self, or (3) Grant Heal 2 by Trance to target and self.", attribute:"1 Insight" },
    { name:"Greater Prophecy", cost:3, verbal:"N/A", description:"Grants from the Prophecy skill are all increased by +1. Thread Skill.", attribute:"Thread Skill" },
    { name:"Healing a Friend", cost:3, verbal:"'Heal 2 to <n>'", description:"Once per Short Rest, heal one person whose fortune you told this gather as your vision predicted their time of need. Beneficial packet attack." },
    { name:"Hear a New Tale", cost:4, verbal:"N/A", description:"Listen to a tale from a group who went on an adventure you were not on. Send an Info Skill about that adventure — this counts as an additional Info Skill beyond your normal two." },
  ],
  "Heartbinder": [
    { name:"Empowered Time of Rest", cost:0, verbal:"'Grant 2 protection to self by Sleep'", description:"Free. Enchant a dwelling so that everyone who sleeps there gains 2 Protection when they awaken and leave. Put a sign on the door." },
    { name:"Empowered Feast", cost:4, verbal:"'Grant one Vitality by inspiration'", description:"Once per event, when you sit with someone else to eat a full meal, grant 1 Vitality to yourself and your companion." },
    { name:"Empowered Audience", cost:2, verbal:"'Refresh 1 <Prowess/Insight/Fortitude> by Harmony'", description:"Once per Long Rest, when you are an audience for a performance, imbue the performer by clapping and speaking with them afterwards — refresh 1 Prowess, Insight, or Fortitude to them." },
    { name:"Empowered Game", cost:2, verbal:"'Heal All'", description:"When, in a Place of Peace, you play or watch a game of up to 6 people, at the end of the round 'Heal All' to everyone in the game." },
  ],
  "Foreseer": [
    { name:"Ward Misfortune", cost:0, verbal:"'Grant Guard to Self by Trance'", description:"Free. After a Short Rest, spend 1 Fortitude for a Guard that blocks the first called melee, missile, or packet attack. After a Long Rest, gain the Guard without spending the attribute.", attribute:"1 Fortitude" },
    { name:"Certainty is Strength", cost:2, verbal:"N/A", description:"Gain +1 point of Purpose. If a vision is presented to you by plot, you can fully refresh one of Prowess, Insight, or Fortitude." },
    { name:"Avoid Ill Fortune", cost:3, verbal:"'Stabilize to Self' or 'Reduce to 10 Damage'", description:"If you are unstable and hit 59 seconds, spend 1 Prowess to stabilize. Also: if hit by a death effect, spend 1 Prowess to reduce it to '10 damage'.", attribute:"1 Prowess" },
    { name:"Erase the Wounds of the Past", cost:4, verbal:"'Heal all by Trance'", description:"If you listen to a PC's story (30+ seconds) about something they did this gather in a Place of Peace, call upon the gravitas of their actions — beneficial packet attack to heal them." },
  ],
  "Oracle": [
    { name:"See the Question", cost:0, verbal:"N/A", description:"Free. Write your research skill as: 'I don't know the exact question I'm looking to ask, but I want to accomplish something plot relevant.' Example: 'Who can I talk to about this?' or 'I want to learn something impactful about <n> plot.'", attribute:"1 Fortitude" },
    { name:"Speak in Tongues", cost:3, verbal:"'Gibberish'", description:"When affected by the Silence spell, you can still use skills and spells that normally require a verbal — say a short phrase in gibberish before calling the effect." },
    { name:"Drinking Away the Future", cost:4, verbal:"'Grant 2 Protection'", description:"When in the tavern drinking with a group of companions (no more than 6 total), grant 2 Protection to the whole group.", attribute:"1 Insight" },
    { name:"Blessed of the Constellations", cost:2, verbal:"'1x / Event'", description:"Start a negotiation with Shade beings: your group takes Spirit form and approaches saying 'Negotiations'. If accepted, remain spirit until negotiations end. If refused ('No Effect'), return to previous location and lose Spirit form." },
  ],
  "Performer": [
    { name:"Protective Performance", cost:0, verbal:"'Grant 2 protection'", description:"Free. In a Place of Peace, grant 2 Protection to one person. If used after giving a Performance, grant to all performers.", attribute:"1 Insight" },
    { name:"Set the Scene", cost:4, verbal:"'Grant Defense, Guard'", description:"When you return from an adventure, sing or tell a tale to set the scene. Gain two 'Grant Guard' effects to use on yourself or companions. Once per Long Rest; if not used before your next Long Rest after returning, it is lost." },
    { name:"Composition", cost:3, verbal:"'Refresh Ability X'", description:"Once per event, refresh one Long Rest skill. Once per Long Rest, if you create a new or expand upon an existing performance art script or lyrics, you can refresh this skill." },
    { name:"Grand Performance", cost:3, verbal:"'Grant One Prowess/Insight/Fortitude to self'", description:"Once per event, when there is a concert, show, or grand performance and you perform in that venue, grant yourself 1 Prowess, Insight, or Fortitude." },
  ],
  "Prodigy": [
    { name:"Complete Focus", cost:0, verbal:"'Purge Mental'", description:"Free. Carry an item representative of your Foundation. Roleplay 3 seconds touching the item, spend 1 attribute, and Purge any mental effect. Can be used even while Paralyzed if the item is on your person.", attribute:"1 Fortitude" },
    { name:"Complimentary Exchange", cost:4, verbal:"'Grant 4 protection by Inspiration'", description:"Show appreciation to someone for their skill in their Foundation (roleplaying choice). After showing appreciation, use a Touch Packet on them for the effect.", attribute:"1 Insight" },
    { name:"Well Founded", cost:4, verbal:"N/A", description:"Gain one additional use per event of each of your per-event Foundation Skills." },
    { name:"Tricks of the Trade", cost:4, verbal:"See description", description:"Once per Long Rest, if you hold an item of your Foundation while taking a Short Rest, you can use the skill 'Fire's Touch, Air's Touch, Water's Touch, Ice's Touch, or Lightning's Touch' without having to spend Void." },
  ],
  "Remembrancer": [
    { name:"Tongue of the Moth", cost:0, verbal:"'Speak to Dead'", description:"Free. Gain the ability to 'Speak to Dead' and 'Speak to Spirit of the Dead', allowing you to speak to someone lying dead in front of you or who has turned to spirit after dying." },
    { name:"Carry Token", cost:3, verbal:"Unique — based on chosen Memento Mori", description:"Carry one of three tokens (switch after Long Rest in Place of Peace): (1) Token of Joy: 1x/Long Rest, stabilize at 59 seconds if unstable. (2) Token of Sorrow: 1x/Long Rest, increase a melee/missile/packet attack to include 'and Agony by Fear' (Thread Skill). (3) Token of Wonder: 1x/Long Rest, spend 2 Prowess and grant 'Melee attack Five Damage and Grant Extra Melee attack Five Damage'." },
    { name:"Friend of Death", cost:4, verbal:"N/A", description:"When you die, you are known to Death as a Remembrancer and may gain additional concessions from Death while in Death's realm. Invoke upon meeting Death as a spirit by saying 'I carry the memories of the dead'." },
    { name:"Sooth Memory", cost:4, verbal:"'Cure Mental by Memory'", description:"Soothe those whose minds are disrupted. Spend one point of Insight to 'Cure Mental by Memory'.", attribute:"1 Insight" },
  ],
  "Savant": [
    { name:"Skilled Learner", cost:0, verbal:"N/A", description:"Free. Select a second Foundation — gain its trait and may purchase its skills (max Foundation skills increases by 1). If the second Foundation is a different category from your first, you may buy skills from both category lists. Choose one free Open Skill: Buckler, Disarm Trap, Pick Locks, Cornucopia, Merchant, Platform, Resourceful, or Two Weapons." },
    { name:"Fast Learner", cost:4, verbal:"N/A", description:"Once per Long Rest, use any crafting skill or attribute-cost skill you know the rules for — without having purchased it. If it has an attribute cost, you must still spend it." },
    { name:"Multi-talented", cost:4, verbal:"N/A", description:"Select a third Foundation — gain its trait and may purchase its skills (max Foundation skills increases by 1 again). Choose another free Open Skill from the Skilled Learner list." },
    { name:"Hard at Work", cost:4, verbal:"N/A", description:"Gain +1 Vitality. This point can allow you to go above the normal maximum." },
  ],
  "Songsmith": [
    { name:"Revel in Yourself", cost:0, verbal:"'2 Damage by Force' or 'Heal 2 by Harmony'", description:"Free. Gain a pool of two effects: two 'Heal 2 by Harmony' beneficial packets OR two '2 Damage by Force' packet attacks. Pool starts empty. Once per Short Rest, when you sing for no less than 1 minute (no audience required), refresh this pool. May be used during a Long or Short Rest." },
    { name:"The Song Game", cost:4, verbal:"'Purge Mental to self'", description:"When you play a song game or sing a childish tune, Purge a mental effect upon completion of the song.", attribute:"1x Insight" },
    { name:"Answer with a Song", cost:4, verbal:"'Heal 3 to Self'", description:"When someone speaks or sings at you and you answer back with a song or verse, Heal 3 to self. Not a spell — no need to have hands free; can be used in combat.", attribute:"1x Prowess" },
    { name:"Choral", cost:4, verbal:"N/A", description:"When you get a group of people to join you in a song of no less than 30 seconds, your next called damage or healing effect is increased by 3. Thread Skill.", attribute:"Thread Skill" },
  ],
  "Strategist": [
    { name:"Better a Forfeit than a Loss", cost:0, verbal:"'Resist'", description:"Free. Keep a chess board, cards, or other game in half-played state in your cabin or a public area (no more than 1 foot on a side). 'Resist' one effect, forfeiting the game. Reset and replay to half-played state to refresh." },
    { name:"Enjoying the Game", cost:3, verbal:"'Imbue Short Rest'", description:"Once per event, 'Imbue Short Rest' to another person. Once per Long Rest, while in a Place of Peace, renew this ability by playing a game of strategy, insight, or luck with one or more opponents." },
    { name:"The Joy of Victory", cost:4, verbal:"'Grant 2 protection'", description:"Pool of 3 Grant 2 Protection effects. Starts game full. Refresh by spending 1 Fortitude when you win a game with another person in a Place of Peace.", attribute:"1 Fortitude" },
    { name:"Breaking the Rules", cost:3, verbal:"'By Luck..'", description:"Four times per event, use a skill that requires Fortitude, Insight, or Prowess without spending the attribute. Start by saying 'By Luck..'" },
  ],
  "Virtuoso": [
    { name:"Performance of Battle", cost:0, verbal:"'Grant Melee attack 2 Damage'", description:"Free. In a Place of Peace, grant a melee attack of 2 damage. If you have just completed a Performance, use this skill on up to 4 people.", attribute:"1 Fortitude" },
    { name:"Climactic Moment", cost:3, verbal:"N/A", description:"When in a Place of Peace, skills that allow you to provide multiple beneficial effects gain one additional effect. Thread Skill.", attribute:"Thread Skill" },
    { name:"Performance of Recovery", cost:4, verbal:"'Heal 5 by Water'", description:"In a Place of Peace, upon completing a Short Rest, Heal 5 by Water to one person. If you have just completed a performance instead, use this skill on up to 4 people." },
    { name:"Find the Stage", cost:4, verbal:"N/A", description:"Once per Long Rest, take a Short Rest and upon completion treat your current location as a Place of Peace for one skill from this Expression. Also allows you to perform while taking a Short Rest." },
  ],
};

// ─── HIDDEN (UNLOCKABLE) EXCELLENCIES & EXPRESSIONS ─────────────────────────

// Selection costs for hidden excellencies (0 = free to add; skills themselves cost CP)
const HIDDEN_EXCELLENCY_COSTS: Record<string, number> = { "Reservoir": 1, "Deadeye": 1, "Whisper": 1 };
const HIDDEN_EXPRESSION_COSTS: Record<string, number> = { "Shadewalker": 1 };

const HIDDEN_EXCELLENCY_SKILLS: Record<string, SkillDef[]> = {
  "Reservoir": [
    { name:"Healing Reservoir", cost:0, verbal:"'Imbue (my name) Reservoir up to 2 people'", description:"Spend 1 Fortitude. Up to 2 imbued people may visit your Reservoir up to 3 times each to 'Heal 2 to Self'. Reservoir cannot be moved once placed. Once per long rest.", attribute:"1 Fortitude" },
    { name:"Absorb Reservoir", cost:2, verbal:"N/A", description:"1x long rest: pick up your Reservoir and turn off its lights. It no longer functions, but you are Healed 5 Vitality and/or gain 5 Protection based on its type." },
    { name:"Add to Reservoir", cost:4, verbal:"N/A", description:"Spend a Fortitude or Prowess (as appropriate) to add two additional people to your Reservoir. Cannot be affected by Expanded Reservoir.", attribute:"1 Fortitude or Prowess" },
    { name:"Deepen Reservoir", cost:3, verbal:"N/A", description:"Your Reservoirs now do +1 Healing or Protection.", attribute:"Thread Skill" },
    { name:"Expanded Reservoir", cost:3, verbal:"N/A", description:"When you Imbue people to your Reservoir you may add one additional person.", attribute:"Thread Skill" },
    { name:"Mending Reservoir", cost:2, verbal:"N/A", description:"Once per event: instead of a Healing or Protection Reservoir, create a Cure Maim Reservoir with the same number of effects. May be added to any other reservoir. Must be explained to attached people." },
    { name:"Move Reservoir", cost:4, verbal:"N/A", description:"Spend one Fortitude to pick up your Reservoir on the field. Must take a short rest before placing it again.", attribute:"1 Fortitude" },
    { name:"Protective Reservoir", cost:4, verbal:"N/A", description:"Spend 1 Prowess when creating your Protective Reservoir. Choose whether it generates Healing, Protection, or both (pay both attributes for both). Works like Healing Reservoir but grants 2 Protection up to 3 times.", attribute:"1 Prowess" },
  ],
  "Deadeye": [
    { name:"Overwhelm", cost:0, verbal:"'4 Damage'", description:"Make an archery attack for '4 Damage'.", attribute:"1 Prowess" },
    { name:"Aim", cost:3, verbal:"N/A", description:"Take 10 seconds of RP aiming without moving your feet. Increase an archery damage attack (including Uncalled) by +2.", attribute:"Thread Skill" },
    { name:"Clear the Field", cost:2, verbal:"N/A", description:"Once per event: use Aim, then make 3 archery attacks of '5 Damage' at different targets. Cannot move between attacks unless using Hold Aim." },
    { name:"Easy Target", cost:2, verbal:"N/A", description:"If a target is repelled, fire against them as if you have aimed.", attribute:"Thread Skill" },
    { name:"Find Aim", cost:2, verbal:"N/A", description:"Once per long rest: if you miss an aimed shot, continue applying the Aim thread skill until you hit with a shot." },
    { name:"Hold Aim", cost:2, verbal:"N/A", description:"Once per short rest: Aim and then move while maintaining your aim. Apply the Aim thread skill on that attack." },
    { name:"Remove Obstacles", cost:4, verbal:"'Repel by Will'", description:"Spend 1 Insight to call 'Repel by Will'.", attribute:"1 Insight" },
    { name:"Shift", cost:4, verbal:"'Avoid'", description:"If you are in the process of aiming and are hit by a melee, missile, or spell attack, spend 1 Insight to call 'Avoid'.", attribute:"1 Insight" },
  ],
  "Whisper": [
    { name:"Fade Away", cost:2, verbal:"'Cure Spirit to Self'", description:"Once per long rest: spend 1 Fortitude and take Spirit Form for up to 1 minute (arms crossed over torso). When exiting, say 'Cure Spirit to Self.' Any effect 'to spirit' or similar breaks the form.", attribute:"1 Fortitude" },
    { name:"Flechette", cost:3, verbal:"N/A", description:"When making a packet attack, expend up to 2 points of armor to deal +1 damage per point of armor spent.", attribute:"Thread Skill" },
    { name:"Strong Will", cost:3, verbal:"N/A", description:"Your non-physical armor is increased by 1 point.", attribute:"Thread Skill" },
    { name:"Repair Armor", cost:4, verbal:"'Repair Armor'", description:"Spend 1 Prowess to gain four uses of 'Repair Armor'.", attribute:"1 Prowess" },
    { name:"Shatter Blade", cost:4, verbal:"'Short Destroy Weapon'", description:"Spend 1 Fortitude to make a packet attack calling 'Short Destroy Weapon'.", attribute:"1 Fortitude" },
    { name:"Metal Shards", cost:4, verbal:"'3 Damage by Force'", description:"Spend 1 Prowess to make two packet attacks, each calling '3 Damage by Force'.", attribute:"1 Prowess" },
    { name:"Shrug It Off", cost:4, verbal:"'Avoid'", description:"Once per short rest: spend 1 Fortitude to resist any melee, missile, or packet attack.", attribute:"1 Fortitude" },
    { name:"Armored Spell", cost:2, verbal:"N/A", description:"Once per event: for your next 10 packet attacks, each time you successfully strike an opponent and they register the hit, you may repair 1 armor." },
  ],
};

const HIDDEN_EXPRESSION_SKILLS: Record<string, SkillDef[]> = {
  "Shadewalker": [
    { name:"Attune to the Shade", cost:0, verbal:"N/A", description:"When you pass through a gate to the Shade, your Prowess, Insight, and Fortitude each increase by one (does not count as a Grant). Returns to normal when you leave the Shade.", attribute:"Thread Skill" },
    { name:"Find the Shade", cost:2, verbal:"N/A", description:"Gain the research topic 'Shade Geography'." },
    { name:"Shade Strikes", cost:3, verbal:"N/A", description:"Once per short rest, choose melee, missile, or packet. Until your next short rest, all called damage attacks of that type can be 'to Shade' with damage increased by 1. Additionally, all your beneficial effects can be 'By Shade'.", attribute:"Thread Skill" },
    { name:"Shade Step", cost:3, verbal:"N/A", description:"Once per long rest: spend 1 Insight and roleplay looking at a place for one minute. Turn to Spirit and walk directly there. Any effect 'To Spirit' or 'To Shade' breaks the travel. Immune to all other effects while traveling. Cannot pass through walls, gates, or barriers.", attribute:"1 Insight" },
  ],
};

// CP cost rules
function attrCost(currentPurchased: number): number { return currentPurchased + 3; }
function totalAttrCost(purchased: number): number {
  let total = 0;
  for (let i = 0; i < purchased; i++) total += attrCost(i);
  return total;
}
function excellencyCost(index: number): number { return 5 + index; }
function expressionCost(index: number): number { return 5 + index; }

const ADVENTURER_SKILLS = [
  { name:"Base Weapon Skills", description:"Skilled with Basic One-Handed & Two-Handed weapons." },
  { name:"First Aid", description:"Stabilize or Cure Maim Limb on yourself or another (1 min)." },
  { name:"Diagnose", description:"Diagnose traits/effects or determine damage taken." },
  { name:"Improvisation", description:"Use an alternative prop if your item prop breaks." },
  { name:"Improved Guard", description:"Choose not to trigger Guard on uncalled damage." },
  { name:"Wear Light Armor", description:"Can wear Light Armor (2 points)." },
  { name:"Repair Armor", description:"1 min Focus to repair all armor points (Verbal: Refresh all armor)." },
  { name:"Purposed", description:"You have the 'Purposed' trait." },
  { name:"Living", description:"You have the 'Living' trait." },
];

const ARMOR_TYPES = [
  { name:"Unarmored", points:0 },
  { name:"Light Armor", points:2 },
  { name:"Skill-Based Armor", points:2 },
  { name:"Medium Armor", points:3 },
  { name:"Heavy Armor", points:4 },
];

const ASPECT_SKILLS: SkillDef[] = [
  { name:"Extra Attribute", cost:3, verbal:"N/A", description:"You have an additional Attribute (choose one of Prowess, Insight, or Fortitude).", isAttributeOrArmor:true },
  { name:"Aspect Armaments", cost:4, verbal:"N/A", description:"You gain a special weapon tied to your Aspect. See Aspect Armament Skills section for details.", isAttributeOrArmor:false },
  { name:"Blast Aspect", cost:2, verbal:"Triple 3 Damage by <Trait>", description:"Choose melee, missile, or packet. Uses your Chosen Aspect Trait.", isAttributeOrArmor:false },
  { name:"Unravel Magic", cost:2, verbal:"Purge Will", description:"Once per event, you can Purge an effect that has the Will trait.", isAttributeOrArmor:false },
  { name:"Invoke Aspect", cost:2, verbal:"… by Aspect", description:"Once per event, change the effect Trait of any non-per-event Skill to the name of your Aspect. This is an Extra Thread Skill.", isAttributeOrArmor:false },
  { name:"Tongue of Aspect", cost:2, verbal:"Speak to <Aspect>", description:"Once per Short Rest, use the ability 'Speak to <Aspect>' where Aspect represents your aspect.", isAttributeOrArmor:false },
  { name:"Aspect Fury", cost:2, verbal:"Reduce", description:"Once per event, if you are affected by a Frenzy effect, you can attack enemies instead of allies. If no enemies are around, you attack allies.", isAttributeOrArmor:false },
  { name:"Aspect Armor", cost:3, verbal:"N/A", description:"If your armor has clear detailing showing your aspect (e.g. faux fur for Beast, fake plants for Plant), treat it as worth one additional armor point. Cannot exceed your skill-based maximum.", isAttributeOrArmor:true },
  { name:"Enhanced Healing", cost:2, verbal:"N/A", description:"Once per event, when using a healing effect, Increase it by 2 and change the trait to 'By <Aspect>'. This is an Extra Thread Skill.", isAttributeOrArmor:false },
  { name:"Channel Aspect", cost:2, verbal:"… By <Trait>", description:"When you use any beneficial skill, you may change the trait to 'By <Trait>' (your Chosen Aspect Trait).", isAttributeOrArmor:false },
  { name:"Absorb Elements", cost:3, verbal:"N/A", description:"Once per Long Rest, when you are affected by your Chosen Trait, you can instead say 'Absorb to Heal 2'.", isAttributeOrArmor:false },
];

const FOUNDATION_TYPES: Record<string, string> = {
  Agriculture:"Resource", Alchemical:"Resource", Arcane:"Specialty",
  Artifice:"Resource", Ecclesiastic:"Specialty", Entertainer:"Interaction",
  Artistic:"Resource", Heroic:"Place", Leisure:"Resource", Mariner:"Place",
  Mendicant:"Interaction", Mercantile:"Resource", Military:"Place",
  Courts:"Interaction", Poverty:"Resource", Reformed:"Interaction",
  Stargazer:"Specialty", Traveler:"Place", University:"Specialty", Wilderness:"Place",
};

const PLACE_SKILLS: SkillDef[] = [
  { name:"Attack", cost:2, verbal:"'4 damage'", description:"Twice per event, gain a 4-damage attack when in your place. Choose Melee, Missile, or Spell when you purchase this." },
  { name:"Defense", cost:2, verbal:"'Reduce to 2 damage'", description:"Once per event, reduce any damage melee, missile, or packet attack to 1 damage." },
  { name:"Boon", cost:2, verbal:"'Grant Melee Attack 4 Damage'", description:"Twice per event, gift another a 4-damage attack (choose Melee, Missile, or Magic when purchased) when in your place." },
  { name:"War Story", cost:2, verbal:"'Grant 2 Protection'", description:"Once per event, when you tell a war story from this or the last event, give yourself and the listener a Protection effect." },
  { name:"Home Ground", cost:2, verbal:"N/A", description:"Once per event, when in your place, gain +1 point of any attribute of your choice. Lost when you leave or after your next Long Rest." },
  { name:"Holding", cost:4, verbal:"N/A", description:"You have a holding — a place or business representing resources tied to your Foundation." },
];

const SPECIALTY_SKILLS: SkillDef[] = [
  { name:"Enhance", cost:2, verbal:"N/A", description:"Once per event, when using a healing or damage effect powered by your Foundation Type, Increase the effect by 4. Extra Thread Skill." },
  { name:"Expose", cost:2, verbal:"'By my gesture, expose <specialty>'", description:"Once per event, expose your Specialty. Examples: Astrology→Shade, Magic→Arcane, Theology→Divine, Spirits→Dead or Spirit, Nature→Beast or Plant." },
  { name:"Convert", cost:2, verbal:"'… by specialty'", description:"Once per event, make a damage, Agony, or Maim attack with the Trait of your specialty (e.g. 'Arcane', 'Shade')." },
  { name:"Share Knowledge", cost:2, verbal:"'Grant 2 Protection'", description:"Once per event, when you share something learned about your Specialty this or last event to someone new, give both of you a Protection effect." },
  { name:"Long Study", cost:2, verbal:"N/A", description:"Once per event, after studying or talking about your specialty with others, gain a point of Insight until your next Long Rest." },
  { name:"Holding", cost:4, verbal:"N/A", description:"You have a holding — a place or business representing resources tied to your Foundation." },
];

const RESOURCE_SKILLS: SkillDef[] = [
  { name:"Enhance", cost:2, verbal:"N/A", description:"Once per event, when using a healing or damage effect powered by your Specialty, Increase the effect by 4. Extra Thread Skill." },
  { name:"Discover", cost:2, verbal:"N/A", description:"You have a way of finding Resources. At check-in you gain an extra 2 Drakar coin." },
  { name:"Convert", cost:2, verbal:"'… by Providence'", description:"Once per event, make a damage, Agony, or Maim attack with the Trait 'By Providence'." },
  { name:"What's in Back", cost:2, verbal:"N/A", description:"Once per event, access an additional list of items for sale from the Guild and purchase one." },
  { name:"Shopping Spree", cost:2, verbal:"N/A", description:"Once per event, when you use a Resource (coin, components, magic items, etc.), gain a point of Prowess until your next Long Rest." },
  { name:"Holding", cost:4, verbal:"N/A", description:"You have a holding — a place or business representing resources tied to your Foundation." },
];

const INTERACTION_SKILLS: SkillDef[] = [
  { name:"Not my Fight", cost:2, verbal:"N/A", description:"Once per event, if roleplaying in an encounter that turns into a fight, turn to Spirit for 10 seconds and move away from combat." },
  { name:"Observer", cost:2, verbal:"N/A", description:"Once per event, when too many people are on a module, offer to go as a Spirit instead — stay to the side, avoid combat, speak only in whispers." },
  { name:"Extrovert", cost:3, verbal:"'Refresh two attributes to self'", description:"Once per event, when you engage in your signature RP (your Interaction type), refresh two points of Insight, Fortitude, or Prowess to yourself." },
  { name:"Fun to Be Around", cost:3, verbal:"'Refresh two attributes'", description:"Once per event, when you engage in your signature RP (your Interaction type), refresh two points of Insight, Fortitude, or Prowess to another." },
  { name:"Mutual Understanding", cost:2, verbal:"N/A", description:"Once per event, after a social Interaction of your type, gain a point of Insight until your next Long Rest." },
  { name:"Holding", cost:4, verbal:"N/A", description:"You have a holding — a place or business representing resources tied to your Foundation." },
];

const OPEN_SKILLS: SkillDef[] = [
  { name:"Agility", cost:4, verbal:"N/A", description:"Gain the benefit of Light Armor without wearing armor. Skills/items that affect armor apply to your costuming instead. Agility only replaces the need for a Light Armor phys rep. If you want the benefits of Medium or Heavy armor, you must wear the appropriate phys rep for that armor type." },
  { name:"Archery", cost:3, verbal:"N/A", description:"Use a bow or crossbow in combat. You get 5 shots; Short Rest to prepare 5 more. You may block with your bow but not wield a weapon in your other hand." },
  { name:"Buckler", cost:3, verbal:"N/A", description:"Use a buckler in combat alongside any one-handed weapon you are skilled with." },
  { name:"Shield", cost:3, verbal:"N/A", description:"Use a shield in combat alongside any basic one-handed weapon you are skilled with." },
  { name:"Two Weapon Fighting", cost:3, verbal:"N/A", description:"Wield two weapons up to 46\" each." },
  { name:"Hafted Weapons", cost:2, verbal:"N/A", description:"Use hafted weapons up to 72\" in length." },
  { name:"Thrown Weapons", cost:3, verbal:"N/A", description:"Carry and use throwing weapons. Must spend 10 seconds preparing a picked-up weapon before throwing again. Short Rest between uses." },
  { name:"Weapon Strike", cost:4, verbal:"'3 Damage'", description:"Wield a weapon to make a melee attack for 3 damage.", attribute:"1 Prowess" },
  { name:"Magical Strike", cost:4, verbal:"'3 Damage by Force'", description:"Conjure a packet attack of 3 damage by Force.", attribute:"1 Insight" },
  { name:"Healing Touch", cost:4, verbal:"'Heal 2 by Magic'", description:"Wield magic to heal a minor wound.", attribute:"1 Fortitude" },
  { name:"Healing Circle", cost:2, verbal:"'Heal All'", description:"Long Rest in a Place of Peace with up to 6 people (including yourself): touch packet to Heal All everyone in the circle." },
  { name:"Medium Armor", cost:3, verbal:"N/A", description:"Wear up to 3 points of armor." },
  { name:"Effortless Armor Repair", cost:3, verbal:"N/A", description:"Take a Short Rest while simultaneously repairing armor. Time-reduction skills apply to only one activity." },
  { name:"Courier", cost:4, verbal:"N/A", description:"Send a physical message via the Lattice to any character you have been formally or informally introduced to." },
  { name:"Disarm Traps", cost:1, verbal:"N/A", description:"Use tools or your hands to disable in-game traps. Cannot damage props without NPC permission." },
  { name:"Pick Locks", cost:1, verbal:"N/A", description:"Engage with lock-based challenges (including picking actual locks) marked as such in-game." },
  { name:"Merchant", cost:2, verbal:"N/A", description:"Gain 3 coins at check-in. May also sell out-of-game items for in-game coin." },
  { name:"Resourceful", cost:2, verbal:"N/A", description:"At check-in, gain 2 random components." },
  { name:"True Sight", cost:2, verbal:"N/A", description:"Between events, send up to 2 yes/no questions about cosmological facts learned in-game. Receive a 100% certain answer." },
  { name:"Cornucopia", cost:2, verbal:"'Heal All'", description:"When you sell an OOG item for in-game coin in a Place of Peace, use a touch packet to Heal All the purchaser." },
  { name:"Platform", cost:2, verbal:"N/A", description:"Carry a platform (no larger than 30\" on any side). Acts as safe ground on terrain effects." },
  { name:"Quick Reflexes", cost:1, verbal:"'Avoid'", description:"1x per Short Rest, Avoid an effect from a terrain hazard (lava, pit, etc.). Can be purchased up to 3 times.", maxCount:3 },
  { name:"Research", cost:4, verbal:"N/A", description:"Submit research questions on topics you have access to (from Foundation, Culture, or in-game roleplay). Plot replies with details." },
  { name:"Summon Light", cost:1, verbal:"N/A", description:"Turn on a non-candle light prop for yourself (no brighter than a glow stick). May hand it out but cannot create a new one until returned or next night." },
  { name:"Summon Music", cost:1, verbal:"N/A", description:"Set up background music in your cabin or a non-public area, or during a special tavern event." },
];

const SAVANT_FREE_SKILL_OPTIONS = ["Buckler", "Disarm Traps", "Pick Locks", "Cornucopia", "Merchant", "Platform", "Resourceful", "Two Weapon Fighting"];

const CULTURE_SKILLS: SkillDef[] = [
  { name:"Appreciation", cost:2, verbal:"'Grant Defense Guard'", description:"When you share something of value from your culture (meal, drinks, art, music) with a player of a different culture, you both gain a Guard against the next called attack." },
  { name:"Camaraderie", cost:2, verbal:"'Heal 4 and Repair 4 Armor to <Culture>'", description:"Once per event, when you see someone of your culture in trouble, remind them of a homeland value and use a touch packet to heal them and restore their armor." },
  { name:"Garb", cost:2, verbal:"'Imbue to self +1 Armor'", description:"Once per event, when dressed in the style of your culture, your clothing gains additional protection — allowing you to exceed your normal armor maximum. Ends at next Long Rest or outfit change." },
  { name:"Homeland", cost:2, verbal:"N/A", description:"Once per event, when you travel to your homeland, gain an extra point of Prowess, Insight, or Fortitude until your next Long Rest or when you leave." },
  { name:"Practice", cost:2, verbal:"'Grant <attack> 4 damage by <Trait>'", description:"Once per event, when you act in a manner that exemplifies your culture, gain a grant attack (melee, missile, or spell) for yourself or another." },
];

const DOMAIN_SKILLS: Record<string, SkillDef[]> = {
  Air: [
    { name:"Air's Determination", cost:0, verbal:"'2 Damage'", description:"Free. When you take a Short Rest you gain three Archery attacks of 2 damage." },
    { name:"Air's Touch", cost:4, verbal:"N/A", description:"When you take a Short Rest, your next Missile attack that costs an attribute is free." },
    { name:"Air's Grace", cost:4, verbal:"N/A", description:"You can refresh your quiver in 30 seconds instead of a minute." },
    { name:"Air's Skill", cost:2, verbal:"N/A", description:"Your quiver holds 10 arrows instead of 5. Once per Short Rest, refresh your quiver with a 10-second Rest." },
    { name:"Air's Last Stand", cost:2, verbal:"'6 Damage'", description:"Once per event, shoot an Archery attack of 6 damage." },
    { name:"Air's Gift", cost:2, verbal:"'Refresh Quiver to self'", description:"Once per event, instantly reset your quiver and gain the effect of Air's Touch simultaneously, without needing to Rest." },
    { name:"Air's Shield", cost:2, verbal:"'Resist'", description:"Once per event, when hit by a missile or packet attack, call 'Resist' to negate it." },
    { name:"Empower Air", cost:3, verbal:"Thread Skill", description:"When you make a Missile Attack of 4 damage or greater, add 1 to the total." },
    { name:"Enhance Air", cost:3, verbal:"Thread Skill", description:"When you use a skill granting multiple Missile damage attacks, gain 1 extra Missile Attack." },
  ],
  Earth: [
    { name:"Earth's Determination", cost:0, verbal:"(See description)", description:"Free. When you complete First Aid on an Unconscious person, you also heal them for 1 Vitality." },
    { name:"Earth's Touch", cost:4, verbal:"(See description)", description:"If at a Place of Peace, you take a Short Rest, and are Centered: gain two uses of 'Heal 2' and 'Grant 2 Protection by [your Trait]'." },
    { name:"Earth's Grace", cost:4, verbal:"N/A", description:"Each time you Center, you gain a point of Protection." },
    { name:"Earth's Skill", cost:4, verbal:"N/A", description:"You gain double from any Skill which grants resources or coin." },
    { name:"Earth's Last Stand", cost:2, verbal:"'Imbue Spirit to self'", description:"Once per event, if you are Centered, take Spirit form for up to one minute." },
    { name:"Earth's Gift", cost:2, verbal:"'Imbue Centered'", description:"Once per event, 'Imbue Centered' to self to instantly become Centered." },
    { name:"Earth's Shield", cost:2, verbal:"'Resist'", description:"Once per event, when hit by a packet or missile effect, say 'Resist' to negate it." },
    { name:"Empower Earth", cost:3, verbal:"Thread Skill", description:"When Centered, your Grant Protection or Heal effects of 2 or higher are increased by 1." },
    { name:"Enhance Earth", cost:3, verbal:"Thread Skill", description:"When Centered, your Skills that allow you to give two or more Grant effects gain 1 additional effect." },
  ],
  Fire: [
    { name:"Fire's Determination", cost:0, verbal:"'2 Damage by Fire'", description:"Free. When you take a Short Rest you gain three packet attacks of 2 Damage by Fire." },
    { name:"Fire's Touch", cost:4, verbal:"N/A", description:"When you take a short rest, your next Non-Beneficial Packet attack that costs an attribute is free." },
    { name:"Fire's Grace", cost:3, verbal:"N/A", description:"Once each Short Rest, you can call 'Surge' and refresh your packet Flurry." },
    { name:"Fire's Skill", cost:4, verbal:"N/A", description:"You can use packet attacks while holding a staff or Basic single-handed weapon in one hand." },
    { name:"Fire's Last Stand", cost:2, verbal:"'6 damage by Fire'", description:"Once per event, cast '6 damage by Fire.' Twice per event call 'Surge' to refresh your packet Flurry." },
    { name:"Fire's Gift", cost:2, verbal:"'Refresh <Skill Name> to self'", description:"Once per Long Rest, if you missed a per-event packet attack Skill, rest 10 seconds to regain it. Cannot be used on multi-effect Skills." },
    { name:"Fire's Shield", cost:2, verbal:"'By my gesture repel by <Trait>'", description:"Once per event, point at a target and Repel them. Twice per event call 'Surge' to refresh your packet Flurry." },
    { name:"Empower Fire", cost:3, verbal:"N/A", description:"When you cast an offensive packet attack of 4 damage or greater, add 1 to the total." },
    { name:"Enhance Fire", cost:3, verbal:"N/A", description:"When you use a Skill granting multiple packet damage attacks, gain one extra packet attack." },
  ],
  Ice: [
    { name:"Ice's Determination", cost:0, verbal:"'Repair 1 Armor to self'", description:"Free. When you take a Short Rest, gain three uses of 'Repair 1 Armor to self'." },
    { name:"Ice's Touch", cost:4, verbal:"'Repair 1 Armor'", description:"When you take a Short Rest, gain three uses of 'Repair 1 Armor'. Stacks with Ice's Determination." },
    { name:"Ice's Grace", cost:4, verbal:"'Resist'", description:"Once per Short Rest, Resist an effect that would destroy your shield or armor." },
    { name:"Ice's Skill", cost:4, verbal:"N/A", description:"You gain the ability to use Heavy Armor. Prerequisite: medium armor." },
    { name:"Ice's Last Stand", cost:2, verbal:"'Heal 5 and Repair 5 armor to self'", description:"Once per event, heal 5 and repair 5 armor to self." },
    { name:"Ice's Gift", cost:2, verbal:"'Grant 2 Protection to self'", description:"Up to three times per event, Grant 2 Protection to yourself or another." },
    { name:"Ice's Shield", cost:2, verbal:"'Reduce by Ice's Shield'", description:"Once per event, when you would have fallen due to called damage, remain standing with 1 Vitality instead." },
    { name:"Empower Ice", cost:3, verbal:"Thread Skill", description:"Your 'heal to self' effects of 2 or greater are increased by 1. Say 'Increase' when you use this." },
    { name:"Enhance Ice", cost:3, verbal:"Thread Skill", description:"Applies a Thread Skill to your armor reducing attacks of 5+ damage by 1. Requires heavy armor. Say 'Reduce' when used." },
  ],
  Lightning: [
    { name:"Lightning's Determination", cost:0, verbal:"'2 Damage'", description:"Free. When you take a Short Rest you gain three Melee attacks of 2 Damage." },
    { name:"Lightning's Touch", cost:4, verbal:"N/A", description:"When you take a Short Rest, your next Melee attack that costs an attribute is free." },
    { name:"Lightning's Grace", cost:4, verbal:"'Resist'", description:"Once per Short Rest, Resist a 'Destroy weapon' effect." },
    { name:"Lightning's Skill", cost:4, verbal:"N/A", description:"Use called melee attacks 'by Force' instead of the Weapon trait. Gain weapon styles: two one-handed weapons, spear + one-handed, spear + buckler." },
    { name:"Lightning's Last Stand", cost:2, verbal:"N/A", description:"Once per event, make a melee attack of 6 damage." },
    { name:"Lightning's Gift", cost:2, verbal:"'Grant Melee attack'", description:"Twice per event, grant a melee attack of 3 damage to yourself or another." },
    { name:"Lightning's Shield", cost:2, verbal:"'Parry'", description:"Once per event, negate a melee attack by calling 'Parry'." },
    { name:"Empower Lightning", cost:3, verbal:"Thread Skill", description:"When you make a melee attack of 4 damage or greater, add 1 to the total." },
    { name:"Enhance Lightning", cost:3, verbal:"Thread Skill", description:"When you use a Skill granting multiple melee damage attacks, gain 1 extra melee attack." },
  ],
  Water: [
    { name:"Water's Determination", cost:0, verbal:"'Heal 1'", description:"Free. When you take a Short Rest you gain five 'Heal 1 by <Trait>' beneficial effects." },
    { name:"Water's Touch", cost:4, verbal:"N/A", description:"When you take a Short Rest, your next beneficial effect Skill that costs an attribute is free." },
    { name:"Water's Grace", cost:4, verbal:"'… and heal 2…'", description:"Once per Short Rest, when you use a Skill (other than First Aid) with a Cure effect, improve it to 'Cure X and Heal 2'." },
    { name:"Water's Skill", cost:4, verbal:"N/A", description:"Use packets (beneficial or non-beneficial) while holding a staff or single-handed weapon in your off hand." },
    { name:"Water's Last Stand", cost:2, verbal:"'Heal All by [Your Trait]'", description:"Once per event, use a touch packet to Heal All to someone else. Twice per event call 'Surge' to refresh your packet Flurry." },
    { name:"Water's Gift", cost:2, verbal:"'Cure Physical/Mental/Elemental/Metabolic by [Your Trait]'", description:"Once per event, cure a single physical, mental, elemental, or metabolic effect on someone else. Twice per event call 'Surge'." },
    { name:"Water's Shield", cost:2, verbal:"'Grant 4 Protection by <Your Trait>'", description:"Once per event, grant 4 Protection to someone else. Twice per event call 'Surge' to refresh your packet Flurry." },
    { name:"Empower Water", cost:3, verbal:"Thread Skill", description:"When you cast a healing effect of 2 or more, add 1 to the total." },
    { name:"Enhance Water", cost:3, verbal:"Thread Skill", description:"When you use a Skill granting multiple healing effects, gain one extra effect." },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getFoundationSkillList(foundation: string): SkillDef[] {
  const fType = FOUNDATION_TYPES[foundation] || "Place";
  return fType === "Place" ? PLACE_SKILLS
       : fType === "Specialty" ? SPECIALTY_SKILLS
       : fType === "Resource" ? RESOURCE_SKILLS
       : INTERACTION_SKILLS;
}

// Merge two skill lists, deduplicating by name (first occurrence wins for display, but both costs count)
function mergeSkillLists(list1: SkillDef[], list2: SkillDef[]): SkillDef[] {
  const seen = new Set();
  const merged = [];
  for (const s of [...list1, ...list2]) {
    if (!seen.has(s.name)) { seen.add(s.name); merged.push(s); }
  }
  return merged;
}

function hasThirdAspect(char: CharState): boolean {
  const aspectedSkills = char.expressionSkillsPurchased["Aspected"] || [];
  return aspectedSkills.some((s: PurchasedSkill) => s.name === "Third Aspect");
}

function hasSkilledLearner(char: CharState): boolean {
  const savantSkills = char.expressionSkillsPurchased["Savant"] || [];
  return savantSkills.some((s: PurchasedSkill) => s.name === "Skilled Learner");
}

function hasDualCitizenship(char: CharState): boolean {
  const ft = char.expressionSkillsPurchased["Far Traveler"] || [];
  return ft.some((s: PurchasedSkill) => s.name === "Dual Citizenship");
}

function hasMultinational(char: CharState): boolean {
  const ft = char.expressionSkillsPurchased["Far Traveler"] || [];
  return ft.some((s: PurchasedSkill) => s.name === "Multinational");
}

function usedCP(char: CharState): number {
  let used = 0;
  char.excellencies.forEach((_: string, i: number) => { used += excellencyCost(i); });
  char.expressions.forEach((_: string, i: number) => { used += expressionCost(i); });
  char.aspectSkillsPurchased.forEach((e: PurchasedSkill) => { used += e.cost || 0; });
  char.foundationSkillsPurchased.forEach((e: PurchasedSkill) => { used += e.cost; });
  char.cultureSkillsPurchased.forEach((e: PurchasedSkill) => { used += e.cost; });
  used += totalAttrCost(char.prowessPurchased);
  used += totalAttrCost(char.insightPurchased);
  used += totalAttrCost(char.fortitudePurchased);
  used += char.purposePurchased * 4;
  used += totalAttrCost(char.vitalityPurchased);
  char.openSkillsPurchased.forEach((e: PurchasedSkill) => { used += e.cost; });
  char.domainSkillsPurchased.forEach((s: PurchasedSkill) => { used += s.cost; });
  Object.values(char.excellencySkillsPurchased).forEach((arr: PurchasedSkill[]) => arr.forEach((s: PurchasedSkill) => { used += s.cost; }));
  Object.values(char.expressionSkillsPurchased).forEach((arr: PurchasedSkill[]) => arr.forEach((s: PurchasedSkill) => { used += s.cost; }));
  (char.hiddenExcellencies || []).forEach((name: string) => { used += HIDDEN_EXCELLENCY_COSTS[name] || 0; });
  (char.hiddenExpressions || []).forEach((name: string) => { used += HIDDEN_EXPRESSION_COSTS[name] || 0; });
  Object.values(char.hiddenExcellencySkillsPurchased || {}).forEach((arr: PurchasedSkill[]) => arr.forEach((s: PurchasedSkill) => { used += s.cost; }));
  Object.values(char.hiddenExpressionSkillsPurchased || {}).forEach((arr: PurchasedSkill[]) => arr.forEach((s: PurchasedSkill) => { used += s.cost; }));
  return used;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Section({ title, children, accent = false }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      border: `2px solid ${accent ? "var(--ink)" : "var(--ink-light)"}`,
      borderRadius: 0, padding: "16px 18px", marginBottom: 20,
      background: "var(--paper)", position: "relative",
      boxShadow: accent ? "3px 3px 0 var(--ink)" : "2px 2px 0 var(--ink-faint)",
    }}>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--ink)", marginBottom: 12,
        paddingBottom: 6, borderBottom: `1px dashed var(--ink-light)`,
      }}>{title}</div>
      {children}
    </div>
  );
}

function StatBox({ label, value, onChange, min = 0, max = 10, costNext = undefined, readOnly = false, accentColor = null }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; costNext?: number; readOnly?: boolean; accentColor?: string | null;
}) {
  const border = accentColor ? `2px solid ${accentColor}` : "2px solid var(--ink)";
  const labelColor = accentColor || "var(--ink-mid)";
  const valueColor = accentColor || "var(--ink)";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:labelColor, textAlign:"center", lineHeight:1.2, maxWidth:64 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
        {!readOnly && <button onClick={() => onChange(Math.max(min, value - 1))} style={btnStyle}>−</button>}
        <div style={{ width:40, height:40, border, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontSize:20, fontWeight:"bold", color:valueColor, background:"var(--paper-warm)", boxShadow:"2px 2px 0 var(--ink-faint)" }}>{value}</div>
        {!readOnly && <button onClick={() => onChange(Math.min(max, value + 1))} style={btnStyle}>+</button>}
      </div>
      {costNext !== undefined && !readOnly && (
        <div style={{ fontSize:9, color:labelColor, fontFamily:"var(--font-body)" }}>next: {costNext} CP</div>
      )}
    </div>
  );
}

const btnStyle = {
  width:20, height:20, border:"1px solid var(--ink-light)", background:"var(--paper)",
  cursor:"pointer", fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink)",
  display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1,
};

function TextInput({ label, value, onChange, placeholder, wide = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; wide?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, flex: wide ? "1 1 100%" : "1 1 140px" }}>
      <label style={{ fontFamily:"var(--font-display)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-mid)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ fontFamily:"var(--font-body)", fontSize:13, border:"1px solid var(--ink-light)", background:"var(--paper-warm)", color:"var(--ink)", padding:"5px 8px", outline:"none", borderRadius:0, width:"100%", boxSizing:"border-box" }} />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, wide = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: (string | { value: string; label: string })[]; wide?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, flex: wide ? "1 1 100%" : "1 1 140px" }}>
      <label style={{ fontFamily:"var(--font-display)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-mid)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ fontFamily:"var(--font-body)", fontSize:13, border:"1px solid var(--ink-light)", background:"var(--paper-warm)", color:"var(--ink)", padding:"5px 8px", outline:"none", borderRadius:0, cursor:"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23333'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center", paddingRight:24, boxSizing:"border-box", width:"100%" }}>
        <option value="">— select —</option>
        {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );
}

function CPBadge({ used, total }: { used: number; total: number }) {
  const remaining = total - used;
  const pct = Math.min(100, (used / total) * 100);
  const over = remaining < 0;
  return (
    <div style={{ background: over ? "var(--red)" : "var(--paper-warm)", border: `2px solid ${over ? "var(--red)" : "var(--ink)"}`, padding:"10px 16px", textAlign:"center", boxShadow:"3px 3px 0 var(--ink-faint)" }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize:10, letterSpacing:"0.12em", color: over ? "white" : "var(--ink-mid)" }}>CHARACTER POINTS</div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:28, color: over ? "white" : "var(--ink)", lineHeight:1 }}>{remaining < 0 ? `−${Math.abs(remaining)}` : remaining}<span style={{ fontSize:14 }}> / {total}</span></div>
      <div style={{ fontSize:10, color: over ? "white" : "var(--ink-mid)", fontFamily:"var(--font-body)" }}>{over ? "OVER BUDGET" : `${used} used`}</div>
      <div style={{ marginTop:6, height:4, background:"var(--ink-faint)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, height:"100%", width:`${pct}%`, background: over ? "red" : "var(--ink)", transition:"width 0.3s" }} />
      </div>
    </div>
  );
}

const TABS = ["Identity","Background","Attributes","Excellencies","Expressions","Open Skills","Spells & Abilities","Notes","Export / Print"];

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontFamily:"var(--font-display)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", padding:"8px 12px", border:"none", borderBottom: active ? "3px solid var(--ink)" : "3px solid transparent", background:"transparent", color: active ? "var(--ink)" : "var(--ink-mid)", cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>
  );
}

function attrChipColor(attribute: string): string | null {
  if (!attribute) return null;
  if (/prowess/i.test(attribute)) return "var(--prowess)";
  if (/insight/i.test(attribute)) return "var(--insight)";
  if (/fortitude/i.test(attribute)) return "var(--fortitude)";
  return null;
}

function SkillPickerList({ skills, countOf, canAdd, onAdd, onRemove }: {
  skills: SkillDef[];
  countOf: (name: string) => number;
  canAdd: (skill: SkillDef) => boolean;
  onAdd: (skill: SkillDef) => void;
  onRemove: (name: string) => void;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {skills.map(skill => {
        const count = countOf(skill.name);
        const isPurchased = count > 0;
        const isFree = skill.cost === 0;
        const addable = canAdd(skill);
        const maxForSkill = skill.maxCount || 1;
        return (
          <div key={skill.name} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"7px 10px", background: isPurchased ? "var(--ink)" : "var(--paper-warm)", border: `1px solid ${isPurchased ? "var(--ink)" : "var(--ink-faint)"}`, opacity: (!isPurchased && !addable) ? 0.45 : 1 }}>
            <div style={{ minWidth:24, display:"flex", flexDirection:"column", alignItems:"center", gap:3, paddingTop:1, flexShrink:0 }}>
              {[...Array(maxForSkill)].map((_, i) => (
                <div key={i} style={{ width:14, height:14, border:`2px solid ${isPurchased ? "var(--paper-warm)" : "var(--ink-light)"}`, background: i < count ? (isPurchased ? "var(--paper-warm)" : "var(--ink)") : "transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor: isFree ? "default" : (i < count ? "pointer" : addable ? "pointer" : "not-allowed") }}
                  onClick={() => { if (isFree) return; if (i < count) onRemove(skill.name); else if (addable) onAdd(skill); }}>
                  {i < count && <span style={{ color: isPurchased ? "var(--ink)" : "var(--paper)", fontSize:9, lineHeight:1 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"baseline", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"var(--font-display)", fontSize:12, color: isPurchased ? "var(--paper-warm)" : "var(--ink)" }}>{skill.name}</span>
                <span style={{ fontSize:9, padding:"1px 5px", background: isFree ? "transparent" : (isPurchased ? "rgba(255,255,255,0.15)" : "var(--ink)"), color: isFree ? (isPurchased ? "rgba(255,255,255,0.6)" : "var(--ink-mid)") : (isPurchased ? "var(--paper-warm)" : "var(--paper)"), border: isFree ? `1px solid ${isPurchased ? "rgba(255,255,255,0.3)" : "var(--ink-faint)"}` : "none", fontStyle: isFree ? "italic" : "normal" }}>{isFree ? "free" : `${skill.cost} CP`}</span>
                {skill.verbal && skill.verbal !== "N/A" && <span style={{ fontSize:9, fontStyle:"italic", color: isPurchased ? "var(--ink-faint)" : "var(--ink-mid)" }}>"{skill.verbal}"</span>}
                {skill.attribute && (() => {
                  const ac = attrChipColor(skill.attribute);
                  return (
                    <span style={{ fontSize:9, fontWeight: ac ? 600 : "normal",
                      color: ac ? (isPurchased ? "rgba(255,255,255,0.85)" : ac) : (isPurchased ? "rgba(255,255,255,0.5)" : "var(--ink-light)"),
                      borderBottom: ac && !isPurchased ? `1.5px solid ${ac}` : "none",
                    }}>[{skill.attribute}]</span>
                  );
                })()}
                {(skill.maxCount ?? 0) > 1 && <span style={{ fontSize:9, color: isPurchased ? "rgba(255,255,255,0.5)" : "var(--ink-light)", fontStyle:"italic" }}>[up to {skill.maxCount}×]</span>}
              </div>
              <div style={{ fontSize:10, marginTop:2, lineHeight:1.4, color: isPurchased ? "rgba(255,255,255,0.7)" : "var(--ink-mid)" }}>{skill.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EXPORT PANEL ────────────────────────────────────────────────────────────

function ExportPanel({ char, setChar }: {
  char: CharState;
  setChar: React.Dispatch<React.SetStateAction<CharState>>;
}) {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [copyMsg, setCopyMsg] = useState("Select all & copy");

  const jsonExport = JSON.stringify(char, null, 2);

  function handleCopyJSON() {
    const ta = document.getElementById("json-export-ta") as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.select();
    try {
      document.execCommand("copy");
      setCopyMsg("✓ Copied!");
      setTimeout(() => setCopyMsg("Select all & copy"), 2000);
    } catch {
      ta.focus();
      setCopyMsg("Press Ctrl/Cmd+A then Ctrl/Cmd+C");
      setTimeout(() => setCopyMsg("Select all & copy"), 4000);
    }
  }

  function handleImport() {
    setImportError("");
    setImportSuccess(false);
    try {
      const parsed = JSON.parse(importText.trim());
      if (typeof parsed !== "object" || !parsed) throw new Error("Invalid format");
      // v3.51 migration: "Acrobat" renamed to "Agility"
      if (Array.isArray(parsed.openSkillsPurchased)) {
        parsed.openSkillsPurchased = parsed.openSkillsPurchased.map((s: PurchasedSkill) =>
          s.name === "Acrobat" ? { ...s, name: "Agility" } : s
        );
      }
      setChar(c => ({ ...c, ...parsed }));
      setImportSuccess(true);
      setImportText("");
      setTimeout(() => setImportSuccess(false), 3000);
    } catch {
      setImportError("Could not parse JSON. Make sure you pasted a complete export from this tool.");
    }
  }

  function buildPrintHTML() {
    const prowess = 2 + (char.prowessPurchased || 0);
    const insight = 2 + (char.insightPurchased || 0);
    const fortitude = 2 + (char.fortitudePurchased || 0);
    const purpose = 5 + (char.purposePurchased || 0);
    const vitality = 2 + (char.vitalityPurchased || 0);
    const used = usedCP(char);
    const total = 50 + (char.bonusCP || 0);
    const activeAspects = [char.aspect1, char.aspect2, char.aspect3].filter(a => a && a !== "(none)");

    type PrintSkill = PurchasedSkill & Partial<SkillDef> & { source?: string };

    function getFL(f: string): SkillDef[] {
      const t = FOUNDATION_TYPES[f] || "Place";
      return t==="Place"?PLACE_SKILLS:t==="Specialty"?SPECIALTY_SKILLS:t==="Resource"?RESOURCE_SKILLS:INTERACTION_SKILLS;
    }

    const allExcSkills: PrintSkill[] = char.excellencies.flatMap((n: string) =>
      (char.excellencySkillsPurchased[n]||[]).map((s: PurchasedSkill) => {
        const def = (EXCELLENCY_SKILLS[n]||[]).find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
        return {...s,...def,source:n};
      })
    );
    const allExprSkills: PrintSkill[] = char.expressions.flatMap((n: string) =>
      (char.expressionSkillsPurchased[n]||[]).map((s: PurchasedSkill) => {
        const def = (EXPRESSION_SKILLS[n]||[]).find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
        return {...s,...def,source:n};
      })
    );
    const domainDefs: PrintSkill[] = char.domainSkillsPurchased.map((s: PurchasedSkill) => {
      const def = (DOMAIN_SKILLS[char.domain]||[]).find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
      return {...s,...def};
    });
    const aspectDefs: PrintSkill[] = char.aspectSkillsPurchased.map((s: PurchasedSkill) => {
      const def = ASPECT_SKILLS.find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
      return {...s,...def};
    });
    const foundDefs: PrintSkill[] = char.foundationSkillsPurchased.map((s: PurchasedSkill) => {
      const defs = [...getFL(char.foundation), ...(char.foundation2?getFL(char.foundation2):[])];
      const def = defs.find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
      return {...s,...def};
    });
    const cultDefs: PrintSkill[] = char.cultureSkillsPurchased.map((s: PurchasedSkill) => {
      const def = CULTURE_SKILLS.find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
      return {...s,...def};
    });
    const openDefs: PrintSkill[] = char.openSkillsPurchased.map((s: PurchasedSkill) => {
      const def = OPEN_SKILLS.find((d: SkillDef) => d.name===s.name) as Partial<SkillDef>|undefined ?? {};
      return {...s,...def};
    });

    const threadSkills = [...allExcSkills,...allExprSkills,...domainDefs,...aspectDefs,...foundDefs,...cultDefs].filter((s: PrintSkill) => {
      return /thread skill/i.test((s.description||"")+(s.attribute||"")+(s.verbal||""));
    });

    const sc = char.culture ? CULTURES.find(c=>c.name===char.culture) : null;
    const sc2 = char.culture2 ? CULTURES.find(c=>c.name===char.culture2) : null;
    const sc3 = char.culture3 ? CULTURES.find(c=>c.name===char.culture3) : null;

    function skillRows(skills: PrintSkill[]): string {
      return skills.map((s: PrintSkill) => {
        const isExtra = /extra thread/i.test((s.description||"")+(s.attribute||""));
        const isThread = /thread skill/i.test((s.description||"")+(s.attribute||"")+(s.verbal||""));
        const badge = s.cost===0 ? '<span style="font-size:7pt;border:0.5pt solid #9a8c6e;padding:1pt 3pt;color:#5a4e3a;">free</span>'
          : `<span style="font-size:7pt;background:#1a1410;color:white;padding:1pt 3pt;">${s.cost} CP</span>`;
        const threadBadge = isExtra ? '<span style="font-size:7pt;background:#7a1e1e;color:white;padding:1pt 3pt;margin-left:3pt;">Extra Thread</span>'
          : isThread ? '<span style="font-size:7pt;background:#555;color:white;padding:1pt 3pt;margin-left:3pt;">Thread</span>' : "";
        const srcBadge = s.source ? `<span style="font-size:7.5pt;color:#5a4e3a;font-style:italic;margin-left:4pt;">· ${s.source}</span>` : "";
        return `<div style="margin-bottom:5pt;padding-bottom:5pt;border-bottom:0.5pt dashed #c8bca0;">
          <div style="font-family:'IM Fell English',serif;font-size:10pt;">${s.name} ${badge}${threadBadge}${srcBadge}</div>
          ${s.verbal&&s.verbal!=="N/A"?`<div style="font-size:8.5pt;font-style:italic;color:#5a4e3a;">"${s.verbal}"</div>`:""}
          ${s.description?`<div style="font-size:8.5pt;color:#5a4e3a;line-height:1.4;margin-top:1pt;">${s.description}</div>`:""}
        </div>`;
      }).join("");
    }

    function infoRow(label: string, value: string): string {
      if (!value) return "";
      return `<div style="display:flex;justify-content:space-between;border-bottom:0.5pt dotted #c8bca0;padding:1.5pt 0;font-size:9.5pt;gap:8pt;">
        <span style="color:#5a4e3a;">${label}</span><span style="font-weight:600;">${value}</span>
      </div>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Numina — ${char.name||"Character"}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Crimson+Pro:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Crimson Pro',Georgia,serif;font-size:11pt;color:#1a1410;background:white;}
.page{padding:16mm 15mm 12mm;max-width:210mm;margin:0 auto;}
.hdr{border-bottom:2pt solid #1a1410;padding-bottom:7pt;margin-bottom:12pt;display:flex;justify-content:space-between;align-items:flex-end;}
h1{font-family:'IM Fell English',serif;font-size:22pt;letter-spacing:0.04em;}
.sub{font-family:'IM Fell English',serif;font-size:8pt;letter-spacing:0.2em;text-transform:uppercase;color:#9a8c6e;}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:0 18pt;}
.sec{margin-bottom:9pt;border-left:2pt solid #c8bca0;padding-left:8pt;}
.sec-t{font-family:'IM Fell English',serif;font-size:8pt;letter-spacing:0.15em;text-transform:uppercase;color:#9a8c6e;margin-bottom:3pt;}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5pt;margin-bottom:9pt;}
.stat{border:1.5pt solid #1a1410;padding:3pt 5pt;text-align:center;}
.stat-v{font-family:'IM Fell English',serif;font-size:18pt;line-height:1;}
.stat-n{font-size:7.5pt;letter-spacing:0.1em;text-transform:uppercase;color:#5a4e3a;}
hr{border:none;border-top:1pt solid #c8bca0;margin:9pt 0;}
.notes{font-size:9pt;line-height:1.6;color:#5a4e3a;white-space:pre-wrap;border-left:2pt solid #c8bca0;padding-left:8pt;margin-bottom:9pt;}
@media print{body{background:white;}.page{padding:12mm 13mm;}}
</style></head><body><div class="page">

<div class="hdr">
  <div>
    <div class="sub">Numina LARP · Character Sheet</div>
    <h1>${char.name||"Unnamed Character"}</h1>
    <div class="sub">${[char.player&&`Player: ${char.player}`,char.pronouns].filter(Boolean).join(" · ")||"&nbsp;"}</div>
  </div>
  <div style="text-align:right;">
    <div class="sub">Character Points</div>
    <div style="font-family:'IM Fell English',serif;font-size:22pt;line-height:1;">${total-used} <span style="font-size:13pt;color:#5a4e3a;">/ ${total}</span></div>
    <div style="font-size:8pt;color:#5a4e3a;">${used} spent</div>
  </div>
</div>

<div class="cols">
<div>
  <div class="sec"><div class="sec-t">Identity</div>
    ${infoRow("Concept", char.characterConcept)}
    ${infoRow("Source", char.source)}
    ${infoRow("Armor", char.armorType)}
  </div>
  <div class="sec"><div class="sec-t">Aspects</div>
    ${activeAspects.map((a,i) => infoRow(`Aspect ${i+1}`, a)).join("")}
    ${infoRow("Chosen Trait", char.chosenTrait)}
  </div>
  <div class="sec"><div class="sec-t">Background</div>
    ${infoRow("Foundation", char.foundation+(FOUNDATION_TYPES[char.foundation]?` (${FOUNDATION_TYPES[char.foundation]})`:""))}
    ${char.foundation2?infoRow("Foundation 2", char.foundation2+(FOUNDATION_TYPES[char.foundation2]?` (${FOUNDATION_TYPES[char.foundation2]})`:"")):""}
    ${infoRow("Culture", char.culture)}
    ${char.culture2?infoRow("Culture 2", char.culture2):""}
    ${char.culture3?infoRow("Culture 3", char.culture3):""}
  </div>
</div>
<div>
  <div style="margin-bottom:9pt;">
    <div class="sec-t" style="font-family:'IM Fell English',serif;font-size:8pt;letter-spacing:0.15em;text-transform:uppercase;color:#9a8c6e;margin-bottom:5pt;">Attributes</div>
    <div class="stats">
      ${[["Prowess",prowess],["Insight",insight],["Fortitude",fortitude],["Void",2],["Purpose",purpose],["Vitality",vitality]].map(([n,v])=>`<div class="stat"><div class="stat-v">${v}</div><div class="stat-n">${n}</div></div>`).join("")}
    </div>
  </div>
  ${char.excellencies.length?`<div class="sec"><div class="sec-t">Excellencies</div>${char.excellencies.map((e,i)=>infoRow(e,`${5+i} CP`)).join("")}</div>`:""}
  ${char.expressions.length?`<div class="sec"><div class="sec-t">Expressions</div>${char.expressions.map((e,i)=>infoRow(e,`${4+i} CP`)).join("")}</div>`:""}
</div>
</div>

${threadSkills.length?`<hr><div class="sec"><div class="sec-t">Thread Skills</div>${skillRows(threadSkills)}</div>`:""}

<hr>
<div class="cols">
<div>
  ${allExcSkills.length?`<div class="sec"><div class="sec-t">Excellency Skills</div>${skillRows(allExcSkills)}</div>`:""}
  ${allExprSkills.length?`<div class="sec"><div class="sec-t">Expression Skills</div>${skillRows(allExprSkills)}</div>`:""}
</div>
<div>
  ${domainDefs.length?`<div class="sec"><div class="sec-t">${char.domain} Domain Skills</div>${skillRows(domainDefs)}</div>`:""}
  ${aspectDefs.length?`<div class="sec"><div class="sec-t">Aspect Skills</div>${skillRows(aspectDefs)}</div>`:""}
  ${foundDefs.length?`<div class="sec"><div class="sec-t">Foundation Skills</div>${skillRows(foundDefs)}</div>`:""}
  ${cultDefs.length?`<div class="sec"><div class="sec-t">Culture Skills</div>${skillRows(cultDefs)}</div>`:""}
  ${openDefs.length?`<div class="sec"><div class="sec-t">Open Skills</div>${skillRows(openDefs)}</div>`:""}
</div>
</div>

${char.abilitiesNotes||char.notes?`<hr><div class="cols">
  ${char.abilitiesNotes?`<div><div class="sec-t" style="font-family:'IM Fell English',serif;font-size:8pt;letter-spacing:.15em;text-transform:uppercase;color:#9a8c6e;margin-bottom:4pt;">Ability Tracker</div><div class="notes">${char.abilitiesNotes}</div></div>`:"<div></div>"}
  ${char.notes?`<div><div class="sec-t" style="font-family:'IM Fell English',serif;font-size:8pt;letter-spacing:.15em;text-transform:uppercase;color:#9a8c6e;margin-bottom:4pt;">Notes</div><div class="notes">${char.notes}</div></div>`:"<div></div>"}
</div>`:""}

<div style="margin-top:18pt;font-size:8pt;color:#9a8c6e;text-align:center;border-top:0.5pt solid #c8bca0;padding-top:5pt;font-style:italic;">
  All contents were created by Zyz Inc for use with the Numina LARP.
  <span style="display:block;margin-top:2pt;color:#c8bca0;font-style:normal;">Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
</div>
</div></body></html>`;
  }

  const ss = {
    section: { border:"2px solid var(--ink-light)", padding:"16px 18px", marginBottom:20, background:"var(--paper)", boxShadow:"2px 2px 0 var(--ink-faint)" },
    title: { fontFamily:"var(--font-display)", fontSize:13, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink)", marginBottom:12, paddingBottom:6, borderBottom:"1px dashed var(--ink-light)" },
    body: { fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", lineHeight:1.7, marginBottom:14 },
    btn: { fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.08em", border:"2px solid var(--ink)", background:"var(--ink)", color:"var(--paper)", padding:"10px 18px", cursor:"pointer", textTransform:"uppercase" },
    btn2: { fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.08em", border:"2px solid var(--ink)", background:"var(--paper)", color:"var(--ink)", padding:"10px 18px", cursor:"pointer", textTransform:"uppercase" },
    note: { fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginTop:10 },
  };

  return (
    <>
      {/* PRINT */}
      <div style={ss.section}>
        <div style={ss.title}>Print / Save as PDF</div>
        <div style={ss.body}>
          Renders a formatted print-ready character sheet below. Use your browser's <strong>Print</strong> function (Ctrl/Cmd+P) or right-click → Print to save as PDF.
        </div>
        <button style={ss.btn} onClick={() => setShowPrint(p => !p)}>
          {showPrint ? "▲ Hide Print View" : "⎙ Show Print View"}
        </button>
        {showPrint && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginBottom:8 }}>
              The sheet below is print-ready. Press <strong>Ctrl/Cmd+P</strong> and choose "Save as PDF" as the destination.
            </div>
            <iframe
              srcDoc={buildPrintHTML()}
              style={{ width:"100%", height:900, border:"1px solid var(--ink-light)", background:"white" }}
              title="Print Preview"
            />
          </div>
        )}
      </div>

      {/* JSON EXPORT */}
      <div style={ss.section}>
        <div style={ss.title}>Export Character Data (JSON)</div>
        <div style={ss.body}>
          Select all text in the box below and copy it. You can paste it into a file, share it, or re-import it here later.
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <button style={ss.btn} onClick={() => setShowJSON(p => !p)}>
            {showJSON ? "▲ Hide JSON" : "{ } Show JSON"}
          </button>
          {showJSON && (
            <button style={ss.btn2} onClick={handleCopyJSON}>{copyMsg}</button>
          )}
        </div>
        {showJSON && (
          <textarea
            id="json-export-ta"
            readOnly
            value={jsonExport}
            style={{ fontFamily:"monospace", fontSize:10, width:"100%", height:220, resize:"vertical", border:"1px solid var(--ink-light)", background:"var(--paper-warm)", color:"var(--ink)", padding:"8px 10px", lineHeight:1.5, outline:"none" }}
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        )}
        <div style={ss.note}>
          Click the text area to select all, then Ctrl/Cmd+C to copy. Save into a <code>.json</code> file to keep it long-term.
        </div>
      </div>

      {/* IMPORT */}
      <div style={ss.section}>
        <div style={ss.title}>Import Character Data</div>
        <div style={ss.body}>
          Paste a previously exported JSON below to restore a character. This will overwrite your current sheet.
        </div>
        <textarea
          value={importText}
          onChange={e => { setImportText(e.target.value); setImportError(""); setImportSuccess(false); }}
          placeholder={'Paste exported JSON here…\n{\n  "name": "Tharadon Ashe",\n  …\n}'}
          style={{ fontFamily:"monospace", fontSize:11, width:"100%", minHeight:120, resize:"vertical", lineHeight:1.5, border: importError ? "2px solid var(--red)" : "1px solid var(--ink-light)", background:"var(--paper-warm)", color:"var(--ink)", padding:"8px 10px", borderRadius:0, outline:"none", marginBottom:10 }}
        />
        {importError && <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--red)", marginBottom:8 }}>✕ {importError}</div>}
        {importSuccess && <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"#2a6a2a", marginBottom:8 }}>✓ Character imported successfully!</div>}
        <button onClick={handleImport} disabled={!importText.trim()}
          style={{ ...ss.btn, opacity: importText.trim() ? 1 : 0.4, cursor: importText.trim() ? "pointer" : "not-allowed" }}>
          ↑ Import Character
        </button>
        <div style={{ ...ss.note, color:"var(--red)" }}>
          ⚠ Importing replaces everything on your current sheet. Export your JSON first if you want to keep it.
        </div>
      </div>

      {/* FORMAT REFERENCE */}
      <div style={{ ...ss.section, borderColor:"var(--ink-faint)" }}>
        <div style={ss.title}>Format Reference</div>
        <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", lineHeight:1.8 }}>
          The JSON is a plain object. Key fields for compatible tools:&nbsp;
          {["name","aspect1/2/3","foundation","foundation2","culture","culture2","culture3","domain","excellencies[]","expressions[]","prowessPurchased","insightPurchased","fortitudePurchased","excellencySkillsPurchased{}","expressionSkillsPurchased{}"].map(f => (
            <code key={f} style={{ fontFamily:"monospace", fontSize:10, background:"var(--paper-warm)", padding:"1px 4px", marginRight:4 }}>{f}</code>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function NuminaSheet() {
  const [tab, setTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const [char, setChar] = useState<CharState>(DEFAULT_CHAR);

  const update = useCallback(<K extends keyof CharState>(key: K, val: CharState[K]) => setChar(c => ({ ...c, [key]: val })), []);

  const prowessVal = 2 + char.prowessPurchased;
  const insightVal = 2 + char.insightPurchased;
  const fortitudeVal = 2 + char.fortitudePurchased;
  const purposeVal = 5 + char.purposePurchased;
  const vitalityVal = 2 + char.vitalityPurchased;
  const totalCP = 50 + char.bonusCP;
  const used = usedCP(char);

  const selectedCulture = CULTURES.find(c => c.name === char.culture);
  const showThirdAspect = hasThirdAspect(char);
  const showSecondFoundation = hasSkilledLearner(char);
  const showSecondCulture = hasDualCitizenship(char);
  const showThirdCulture = hasMultinational(char);

  // Compute active aspects (up to 3)
  const activeAspects = [char.aspect1, char.aspect2, showThirdAspect ? char.aspect3 : ""]
    .filter(a => a && a !== "(none)");

  // Compute aspect skill max: base 3, +3 if Aspect Versatility is purchased
  const hasAspectVersatility = char.aspectSkillsPurchased.some(s => s.name === "Aspect Versatility");
  const aspectSkillMax = 3 + (hasAspectVersatility ? 3 : 0);

  // Compute foundation skill list (merged if Skilled Learner + different category)
  function getFoundationSkills() {
    const list1 = char.foundation ? getFoundationSkillList(char.foundation) : [];
    if (!showSecondFoundation || !char.foundation2) return list1;
    const list2 = getFoundationSkillList(char.foundation2);
    const type1 = FOUNDATION_TYPES[char.foundation];
    const type2 = FOUNDATION_TYPES[char.foundation2];
    if (type1 !== type2) return mergeSkillLists(list1, list2);
    return list1; // same category — no extra skills unlocked
  }

  // Max foundation skills: base 2, +1 if Skilled Learner, +1 if Multi-talented
  const hasMultiTalented = (char.expressionSkillsPurchased["Savant"] || []).some(s => s.name === "Multi-talented");
  const foundationSkillMax = 2 + (showSecondFoundation ? 1 : 0) + (hasMultiTalented ? 1 : 0);

  // Total excellency slots used (regular + hidden share the cap of 3)
  const totalExcellencies = char.excellencies.length + char.hiddenExcellencies.length;
  // Total expression slots used (regular + hidden share the cap of 2)
  const totalExpressions = char.expressions.length + char.hiddenExpressions.length;

  // Add/remove excellency
  function addExcellency(name: string): void {
    if (!name || char.excellencies.includes(name) || totalExcellencies >= 3) return;
    const freeSkills = (EXCELLENCY_SKILLS[name] || []).filter((s: SkillDef) => s.cost === 0);
    setChar(c => ({ ...c, excellencies: [...c.excellencies, name], excellencySkillsPurchased: { ...c.excellencySkillsPurchased, [name]: freeSkills.map((s: SkillDef) => ({ name:s.name, cost:0 })) } }));
  }
  function removeExcellency(idx: number): void {
    const name = char.excellencies[idx];
    setChar(c => { const next = { ...c.excellencySkillsPurchased }; delete next[name]; return { ...c, excellencies: c.excellencies.filter((_: string, i: number) => i !== idx), excellencySkillsPurchased: next }; });
  }

  // Add/remove hidden excellency
  function addHiddenExcellency(name: string): void {
    if (!name || char.hiddenExcellencies.includes(name) || totalExcellencies >= 3) return;
    const freeSkills = (HIDDEN_EXCELLENCY_SKILLS[name] || []).filter((s: SkillDef) => s.cost === 0);
    setChar(c => ({ ...c, hiddenExcellencies: [...c.hiddenExcellencies, name], hiddenExcellencySkillsPurchased: { ...c.hiddenExcellencySkillsPurchased, [name]: freeSkills.map((s: SkillDef) => ({ name:s.name, cost:0 })) } }));
  }
  function removeHiddenExcellency(name: string): void {
    setChar(c => { const next = { ...c.hiddenExcellencySkillsPurchased }; delete next[name]; return { ...c, hiddenExcellencies: c.hiddenExcellencies.filter((e: string) => e !== name), hiddenExcellencySkillsPurchased: next }; });
  }

  // Add/remove hidden expression
  function addHiddenExpression(name: string): void {
    if (!name || char.hiddenExpressions.includes(name) || totalExpressions >= 2) return;
    const freeSkills = (HIDDEN_EXPRESSION_SKILLS[name] || []).filter((s: SkillDef) => s.cost === 0);
    setChar(c => ({ ...c, hiddenExpressions: [...c.hiddenExpressions, name], hiddenExpressionSkillsPurchased: { ...c.hiddenExpressionSkillsPurchased, [name]: freeSkills.map((s: SkillDef) => ({ name:s.name, cost:0 })) } }));
  }
  function removeHiddenExpression(name: string): void {
    setChar(c => { const next = { ...c.hiddenExpressionSkillsPurchased }; delete next[name]; return { ...c, hiddenExpressions: c.hiddenExpressions.filter((e: string) => e !== name), hiddenExpressionSkillsPurchased: next }; });
  }

  // Add/remove expression
  function addExpression(name: string): void {
    if (!name || char.expressions.includes(name) || totalExpressions >= 2) return;
    const freeSkills = (EXPRESSION_SKILLS[name] || []).filter((s: SkillDef) => s.cost === 0);
    setChar(c => ({ ...c, expressions: [...c.expressions, name], expressionSkillsPurchased: { ...c.expressionSkillsPurchased, [name]: freeSkills.map((s: SkillDef) => ({ name:s.name, cost:0 })) } }));
  }
  function removeExpression(idx: number): void {
    const name = char.expressions[idx];
    setChar(c => {
      const next = { ...c.expressionSkillsPurchased }; delete next[name];
      // If removing Aspected, clear aspect3; if removing Savant, clear foundation2
      const upd: Partial<CharState> & { expressions: string[]; expressionSkillsPurchased: Record<string, PurchasedSkill[]> } = {
        expressions: c.expressions.filter((_: string, i: number) => i !== idx),
        expressionSkillsPurchased: next,
      };
      if (name === "Aspected") upd.aspect3 = "";
      if (name === "Savant") { upd.foundation2 = ""; upd.foundationSkillsPurchased = []; upd.savantFreeSkill1 = ""; upd.savantFreeSkill2 = ""; }
      if (name === "Far Traveler") { upd.culture2 = ""; upd.culture3 = ""; }
      return { ...c, ...upd };
    });
  }

  const inputStyle = {
    fontFamily:"var(--font-body)", fontSize:12,
    border:"1px solid var(--ink-light)", background:"var(--paper-warm)",
    color:"var(--ink)", padding:"4px 7px", borderRadius:0, outline:"none", flex:1,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        :root { --font-display: 'IM Fell English', serif; --font-body: 'Crimson Pro', Georgia, serif; }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${darkMode ? "#0e0c0a" : "#2a2018"}; min-height:100vh; display:flex; justify-content:center; padding:20px; }
        input, select, textarea { font-family:var(--font-body); }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:var(--paper); }
        ::-webkit-scrollbar-thumb { background:var(--ink-light); }
      `}</style>

      <div style={{
        width:"100%", maxWidth:860, background:"var(--paper)",
        boxShadow:"0 0 60px rgba(0,0,0,0.7), inset 0 0 100px rgba(0,0,0,0.05)",
        position:"relative", overflow:"hidden",
        // Theme tokens — cascade to all children
        ...( darkMode ? {
          "--paper":"#1e1a14", "--paper-warm":"#26201a", "--ink":"#ddd0b8",
          "--ink-mid":"#a89070", "--ink-light":"#6a5a42", "--ink-faint":"#3c3028",
          "--red":"#cc5555", "--accent":"#c8a06a",
          "--prowess":"#e07070", "--insight":"#6090d8", "--fortitude":"#52b86a",
        } : {
          "--paper":"#f5f0e8", "--paper-warm":"#ede8dc", "--ink":"#1a1410",
          "--ink-mid":"#5a4e3a", "--ink-light":"#9a8c6e", "--ink-faint":"#c8bca0",
          "--red":"#7a1e1e", "--accent":"#4a3010",
          "--prowess":"#8b1c1c", "--insight":"#1a3d6b", "--fortitude":"#1a5c2a",
        }) as React.CSSProperties,
      }}>

        {/* Corner marks */}
        {["top:8px;left:8px","top:8px;right:8px","bottom:8px;left:8px","bottom:8px;right:8px"].map((pos,i) => (
          <div key={i} style={{ position:"absolute", [pos.split(";")[0].split(":")[0]]:pos.split(";")[0].split(":")[1], [pos.split(";")[1].split(":")[0]]:pos.split(";")[1].split(":")[1], width:16, height:16, borderTop:i<2?"2px solid var(--ink-light)":"none", borderBottom:i>=2?"2px solid var(--ink-light)":"none", borderLeft:(i===0||i===2)?"2px solid var(--ink-light)":"none", borderRight:(i===1||i===3)?"2px solid var(--ink-light)":"none", zIndex:10, pointerEvents:"none" }} />
        ))}

        {/* Header */}
        <div style={{ background:"var(--ink)", padding:"20px 28px 16px", textAlign:"center", position:"relative" }}>
          <button onClick={() => setDarkMode(d => !d)} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} style={{ position:"absolute", top:12, right:14, background:"transparent", border:"1px solid var(--ink-light)", color:"var(--paper-warm)", cursor:"pointer", fontFamily:"var(--font-body)", fontSize:16, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.8 }}>
            {darkMode ? "☀" : "☾"}
          </button>
          <div style={{ fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.3em", color:"var(--ink-faint)", textTransform:"uppercase", marginBottom:4 }}>Numina LARP · 2026</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:32, color:"var(--paper-warm)", letterSpacing:"0.05em", lineHeight:1 }}>Character Sheet</div>
          {char.name && <div style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:16, color:"var(--ink-faint)", marginTop:4 }}>{char.name}</div>}
        </div>

        {/* CP Bar */}
        <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--ink-faint)", display:"flex", gap:12, alignItems:"center", background:"var(--paper-warm)" }}>
          <CPBadge used={used} total={totalCP} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", lineHeight:1.5 }}>
              <strong>Starting CP:</strong> 50 &nbsp;·&nbsp; <strong>Bonus CP:</strong>
              <input type="number" value={char.bonusCP} onChange={e => update("bonusCP", parseInt(e.target.value)||0)} style={{ ...inputStyle, width:46, marginLeft:4 }} min={0} />
            </div>
            <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginTop:4, lineHeight:1.4 }}>Earn bonus CP by attending events (1), submitting PELs (0.5), NPCing (up to 2), setup/cleanup tasks (0.5 each).</div>
            <div style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:11, color:"var(--ink-light)", marginTop:6, letterSpacing:"0.02em" }}>All contents were created by Zyz Inc for use with the Numina LARP.</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", overflowX:"auto", borderBottom:"1px solid var(--ink-faint)", background:"var(--paper)", paddingLeft:8 }}>
          {TABS.map((t,i) => <Tab key={t} label={t} active={tab===i} onClick={() => setTab(i)} />)}
        </div>

        {/* Content */}
        <div style={{ padding:"20px 20px 32px" }}>

          {/* ── TAB 0: IDENTITY ── */}
          {tab === 0 && (
            <>
              <Section title="Character Identity" accent>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  <TextInput label="Character Name" value={char.name} onChange={v => update("name",v)} placeholder="e.g. Tharadon Ashe" />
                  <TextInput label="Player Name" value={char.player} onChange={v => update("player",v)} placeholder="Your name" />
                  <TextInput label="Pronouns" value={char.pronouns} onChange={v => update("pronouns",v)} placeholder="they/them" />
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:10 }}>
                  <TextInput label="Character Concept" value={char.characterConcept} onChange={v => update("characterConcept",v)} placeholder="e.g. A reformed thief turned healer..." wide />
                </div>
              </Section>

              <Section title="Adventurer Traits (Free)">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>All adventurers begin with the following skills at no CP cost:</div>
                {ADVENTURER_SKILLS.map(s => (
                  <div key={s.name} style={{ padding:"8px 10px", borderBottom:"1px dashed var(--ink-faint)" }}>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:11, color:"var(--ink)" }}>{s.name}</div>
                    <div style={{ fontSize:10, color:"var(--ink-mid)", marginTop:2 }}>{s.description}</div>
                  </div>
                ))}
              </Section>

              <Section title="Armor">
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"flex-end" }}>
                  <SelectInput label="Armor Type Worn" value={char.armorType} onChange={v => update("armorType",v)} options={ARMOR_TYPES.map(a => ({ value:a.name, label:`${a.name} (${a.points} pts)` }))} />
                  <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--ink-mid)", paddingBottom:8 }}>
                    Armor Points: <strong style={{color:"var(--ink)"}}>{(ARMOR_TYPES.find(a=>a.name===char.armorType)||ARMOR_TYPES[0]).points}</strong>
                    <span style={{fontSize:11}}> (max 4 without heavy, 5 with heavy)</span>
                  </div>
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginTop:8, lineHeight:1.5 }}>Light: chest OR extremities in flexible reinforced material · Medium: both chest+extremities OR rigid chest · Heavy: rigid chest + rigid extremities</div>
              </Section>

              <Section title="Magical Source">
                <SelectInput label="Source" value={char.source} onChange={v => update("source",v)} options={["Arcane","Divine","Surgery","Alchemical","Tinkered","Arcaneering","Aspect","Other"]} wide />
              </Section>
            </>
          )}

          {/* ── TAB 1: BACKGROUND ── */}
          {tab === 1 && (
            <>
              <Section title="Aspects" accent>
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>
                  Your Aspect is an outward presentation of your inner self. You may have 1–2 Aspects normally; 3 if you have the Aspected Expression with Third Aspect purchased. You may purchase up to {aspectSkillMax} Aspect Skills total.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:10 }}>
                  <SelectInput label="Aspect 1 (required)" value={char.aspect1} onChange={v => update("aspect1",v)} options={ASPECTS} />
                  <SelectInput label="Aspect 2 (optional)" value={char.aspect2} onChange={v => update("aspect2",v)} options={["(none)",...ASPECTS.filter(a => a !== char.aspect1)]} />
                  {showThirdAspect && (
                    <SelectInput
                      label="Aspect 3 (Aspected · Third Aspect)"
                      value={char.aspect3}
                      onChange={v => update("aspect3",v)}
                      options={["(none)",...ASPECTS.filter(a => a !== char.aspect1 && a !== char.aspect2)]}
                    />
                  )}
                </div>
                {!showThirdAspect && (
                  <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", fontStyle:"italic", marginBottom:10 }}>
                    A third Aspect slot unlocks when you take the Aspected Expression and purchase the "Third Aspect" skill.
                  </div>
                )}
                <TextInput label="Chosen Aspect Trait" value={char.chosenTrait} onChange={v => update("chosenTrait",v)} placeholder="e.g. Fire, Force, Fear, Poison..." wide />

                {/* Aspect Skills */}
                <div style={{ marginTop:14, borderTop:"1px dashed var(--ink-faint)", paddingTop:12 }}>
                  {(() => {
                    const numAspects = activeAspects.length;
                    const purchased = char.aspectSkillsPurchased;
                    const totalSpent = purchased.reduce((s,e) => s + e.cost, 0);
                    const atFull = purchased.length >= aspectSkillMax;
                    const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                    const canAdd = (skill: SkillDef) => {
                      if (atFull) return false;
                      if (!skill.isAttributeOrArmor && numAspects >= 2 && countOf(skill.name) < numAspects) return true;
                      if (countOf(skill.name) >= 1) return false;
                      return true;
                    };
                    const addSkill = (skill: SkillDef) => { if (!canAdd(skill)) return; update("aspectSkillsPurchased", [...purchased, { name:skill.name, cost:skill.cost }]); };
                    const removeOne = (name: string) => {
                      const idx = [...purchased].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                      if (idx === -1) return;
                      update("aspectSkillsPurchased", purchased.filter((_: PurchasedSkill, i: number) => i !== purchased.length - 1 - idx));
                    };
                    return (
                      <>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                          <div style={{ fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.05em" }}>
                            Aspect Skills &nbsp;<strong style={{ color: atFull ? "var(--red)" : "var(--ink)" }}>{purchased.length}</strong><span style={{color:"var(--ink-mid)"}}> / {aspectSkillMax}</span>
                          </div>
                          <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)" }}>{totalSpent} CP spent</div>
                        </div>
                        {numAspects >= 2 && <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginBottom:8, fontStyle:"italic" }}>With {numAspects} Aspects, you may buy non-attribute/armor skills up to {numAspects}× (once per Aspect).</div>}
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {ASPECT_SKILLS.map(skill => {
                            const count = countOf(skill.name);
                            const addable = canAdd(skill);
                            const maxForSkill = skill.isAttributeOrArmor ? 1 : Math.max(1, numAspects);
                            const isPurchased = count > 0;
                            return (
                              <div key={skill.name} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"7px 10px", background: isPurchased ? "var(--ink)" : "var(--paper-warm)", border:`1px solid ${isPurchased ? "var(--ink)" : "var(--ink-faint)"}`, opacity:(!isPurchased && !addable) ? 0.45 : 1 }}>
                                <div style={{ minWidth:24, display:"flex", flexDirection:"column", alignItems:"center", gap:3, paddingTop:1, flexShrink:0 }}>
                                  {[...Array(maxForSkill)].map((_,i) => (
                                    <div key={i} style={{ width:14, height:14, border:`2px solid ${isPurchased ? "var(--paper-warm)" : "var(--ink-light)"}`, background: i < count ? (isPurchased ? "var(--paper-warm)" : "var(--ink)") : "transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor: i < count ? "pointer" : addable ? "pointer" : "not-allowed" }}
                                      onClick={() => { if (i < count) removeOne(skill.name); else if (addable) addSkill(skill); }}>
                                      {i < count && <span style={{ color: isPurchased ? "var(--ink)" : "var(--paper)", fontSize:9, lineHeight:1 }}>✓</span>}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ display:"flex", gap:8, alignItems:"baseline", flexWrap:"wrap" }}>
                                    <span style={{ fontFamily:"var(--font-display)", fontSize:12, color: isPurchased ? "var(--paper-warm)" : "var(--ink)" }}>{skill.name}</span>
                                    <span style={{ fontSize:9, padding:"1px 5px", background: isPurchased ? "rgba(255,255,255,0.15)" : "var(--ink)", color: isPurchased ? "var(--paper-warm)" : "var(--paper)" }}>{skill.cost} CP{count===2?" ×2":count===3?" ×3":""}</span>
                                    {skill.verbal !== "N/A" && <span style={{ fontSize:9, fontStyle:"italic", color: isPurchased ? "var(--ink-faint)" : "var(--ink-mid)" }}>"{skill.verbal}"</span>}
                                    {skill.isAttributeOrArmor && <span style={{ fontSize:9, color: isPurchased ? "rgba(255,255,255,0.5)" : "var(--ink-light)", fontStyle:"italic" }}>[limit: 1 max]</span>}
                                  </div>
                                  <div style={{ fontSize:10, marginTop:2, lineHeight:1.4, color: isPurchased ? "rgba(255,255,255,0.7)" : "var(--ink-mid)" }}>{skill.description}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Section>

              <Section title="Foundation">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>
                  Your Foundation represents what your character did before adventuring. You may purchase up to {foundationSkillMax} Foundation Skill{foundationSkillMax !== 1 ? "s" : ""}.
                  {showSecondFoundation && char.foundation && char.foundation2 && FOUNDATION_TYPES[char.foundation] !== FOUNDATION_TYPES[char.foundation2] && (
                    <span style={{ color:"var(--ink)", fontWeight:"bold" }}> Your two Foundations are different categories — you may purchase skills from both lists.</span>
                  )}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:10 }}>
                  <SelectInput label="Foundation 1" value={char.foundation} onChange={v => {
                    setChar(c => {
                      const oldFreeNames = c.domain ? (DOMAIN_SKILLS[c.domain]||[]).filter(s=>s.cost===0).map(s=>s.name) : [];
                      return { ...c, foundation:v, foundationSkillsPurchased:[] };
                    });
                  }} options={FOUNDATIONS} />
                  {showSecondFoundation && (
                    <SelectInput
                      label="Foundation 2 (Savant · Skilled Learner)"
                      value={char.foundation2}
                      onChange={v => update("foundation2", v)}
                      options={FOUNDATIONS.filter(f => f !== char.foundation)}
                    />
                  )}
                </div>
                {!showSecondFoundation && (
                  <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", fontStyle:"italic", marginBottom:10 }}>
                    A second Foundation slot unlocks when you take the Savant Expression and purchase "Skilled Learner."
                  </div>
                )}
                {char.foundation && (() => {
                  const skillList = getFoundationSkills();
                  const purchased = char.foundationSkillsPurchased;
                  const totalSpent = purchased.reduce((s,e) => s+e.cost, 0);
                  const atFull = purchased.length >= foundationSkillMax;
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => !atFull && countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => { if (!canAdd(skill)) return; update("foundationSkillsPurchased", [...purchased, {name:skill.name, cost:skill.cost}]); };
                  const removeSkill = (name: string) => {
                    const idx = [...purchased].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                    if (idx===-1) return;
                    update("foundationSkillsPurchased", purchased.filter((_: PurchasedSkill, i: number) => i !== purchased.length-1-idx));
                  };
                  return (
                    <div style={{ marginTop:14, borderTop:"1px dashed var(--ink-faint)", paddingTop:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:11, letterSpacing:"0.05em" }}>
                          Foundation Skills &nbsp;<strong style={{ color: atFull ? "var(--red)" : "var(--ink)" }}>{purchased.length}</strong><span style={{color:"var(--ink-mid)"}}> / {foundationSkillMax}</span>
                        </div>
                        <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)" }}>{totalSpent} CP spent</div>
                      </div>
                      <SkillPickerList skills={skillList} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                    </div>
                  );
                })()}
              </Section>

              <Section title="Culture">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>Your Culture provides a backdrop for your upbringing. You may purchase up to 2 Culture Skills.</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom: (showSecondCulture || showThirdCulture) ? 6 : 10 }}>
                  <SelectInput label="Culture 1 (primary)" value={char.culture} onChange={v => update("culture",v)} options={CULTURES.map(c=>c.name)} />
                  {showSecondCulture && (
                    <SelectInput
                      label="Culture 2 (Far Traveler · Dual Citizenship)"
                      value={char.culture2}
                      onChange={v => update("culture2", v)}
                      options={CULTURES.map(c=>c.name).filter(n => n !== char.culture)}
                    />
                  )}
                  {showThirdCulture && (
                    <SelectInput
                      label="Culture 3 (Far Traveler · Multinational)"
                      value={char.culture3}
                      onChange={v => update("culture3", v)}
                      options={CULTURES.map(c=>c.name).filter(n => n !== char.culture && n !== char.culture2)}
                    />
                  )}
                </div>
                {!showSecondCulture && (
                  <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", fontStyle:"italic", marginBottom:10 }}>
                    A second Culture slot unlocks when you take the Far Traveler Expression and purchase "Dual Citizenship." A third unlocks with "Multinational."
                  </div>
                )}
                {showSecondCulture && (
                  <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", marginBottom:10, padding:"6px 10px", background:"var(--paper-warm)", border:"1px dashed var(--ink-light)" }}>
                    {char.culture2
                      ? `✓ Dual Citizenship active: you have the trait and may purchase skills of ${char.culture2}.`
                      : "✓ Dual Citizenship active — select your second Culture above."}
                    {showThirdCulture && (char.culture3
                      ? ` Multinational active: you also have ${char.culture3}.`
                      : " Multinational active — select your third Culture above.")}
                  </div>
                )}
                {/* Culture info blocks */}
                {[char.culture, showSecondCulture ? char.culture2 : null, showThirdCulture ? char.culture3 : null].filter(Boolean).map((cname) => {
                  const sc = CULTURES.find(c => c.name === cname);
                  return sc ? (
                    <div key={cname} style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:8, padding:"8px 10px", border:"1px dashed var(--ink-light)", background:"var(--paper-warm)", lineHeight:1.6 }}>
                      <strong>{cname}</strong> — <strong>Research Topic:</strong> {sc.research}
                    </div>
                  ) : null;
                })}
                {char.culture && (() => {
                  const purchased = char.cultureSkillsPurchased;
                  const totalSpent = purchased.reduce((s,e)=>s+e.cost,0);
                  const atFull = purchased.length >= 2;
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => !atFull && countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => { if (!canAdd(skill)) return; update("cultureSkillsPurchased", [...purchased, {name:skill.name, cost:skill.cost}]); };
                  const removeSkill = (name: string) => {
                    const idx = [...purchased].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                    if (idx===-1) return;
                    update("cultureSkillsPurchased", purchased.filter((_: PurchasedSkill, i: number) => i !== purchased.length-1-idx));
                  };
                  return (
                    <div style={{ marginTop:14, borderTop:"1px dashed var(--ink-faint)", paddingTop:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:11 }}>Culture Skills &nbsp;<strong style={{color:atFull?"var(--red)":"var(--ink)"}}>{purchased.length}</strong><span style={{color:"var(--ink-mid)"}}> / 2</span></div>
                        <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)" }}>{totalSpent} CP spent</div>
                      </div>
                      <SkillPickerList skills={CULTURE_SKILLS} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                    </div>
                  );
                })()}
              </Section>

              <Section title="Domain">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>Your Domain defines your battle role and gives you access to domain-specific skills and locked Excellencies.</div>
                <SelectInput label="Domain" value={char.domain} onChange={v => {
                  setChar(c => {
                    const freeSkills = v ? (DOMAIN_SKILLS[v]||[]).filter(s=>s.cost===0) : [];
                    const oldFreeNames = c.domain ? (DOMAIN_SKILLS[c.domain]||[]).filter(s=>s.cost===0).map(s=>s.name) : [];
                    const kept = c.domainSkillsPurchased.filter(e => !oldFreeNames.includes(e.name));
                    return { ...c, domain:v, domainSkillsPurchased:[...kept, ...freeSkills.map(s=>({name:s.name, cost:0}))] };
                  });
                }} options={DOMAINS} wide />
                {char.domain && (() => {
                  const skills = DOMAIN_SKILLS[char.domain] || [];
                  const purchased = char.domainSkillsPurchased;
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => { if (!canAdd(skill)) return; update("domainSkillsPurchased", [...purchased, {name:skill.name, cost:skill.cost}]); };
                  const removeSkill = (name: string) => {
                    const idx = [...purchased].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                    if (idx===-1) return;
                    update("domainSkillsPurchased", purchased.filter((_: PurchasedSkill, i: number) => i !== purchased.length-1-idx));
                  };
                  return (
                    <div style={{ marginTop:14, borderTop:"1px dashed var(--ink-faint)", paddingTop:12 }}>
                      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
                        <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)" }}>{purchased.reduce((s,e)=>s+e.cost,0)} CP spent</div>
                      </div>
                      <SkillPickerList skills={skills} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                    </div>
                  );
                })()}
              </Section>

              <Section title="Costume Notes">
                <textarea value={char.costumeNotes} onChange={e => update("costumeNotes",e.target.value)} placeholder="Describe your costume, Aspect makeup requirements, Armament appearance, cultural garb, etc." style={{ ...inputStyle, width:"100%", minHeight:80, resize:"vertical", lineHeight:1.5 }} />
              </Section>
            </>
          )}

          {/* ── TAB 2: ATTRIBUTES ── */}
          {tab === 2 && (
            <>
              <Section title="Core Attributes" accent>
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:16, lineHeight:1.5 }}>Prowess, Insight, and Fortitude start at 2 each and are <em>spent</em> to use skills.</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:20, justifyContent:"center", marginBottom:20 }}>
                  <StatBox label="Prowess" value={prowessVal} min={2} max={10} onChange={v => update("prowessPurchased",v-2)} costNext={attrCost(char.prowessPurchased)} accentColor="var(--prowess)" />
                  <StatBox label="Insight" value={insightVal} min={2} max={10} onChange={v => update("insightPurchased",v-2)} costNext={attrCost(char.insightPurchased)} accentColor="var(--insight)" />
                  <StatBox label="Fortitude" value={fortitudeVal} min={2} max={10} onChange={v => update("fortitudePurchased",v-2)} costNext={attrCost(char.fortitudePurchased)} accentColor="var(--fortitude)" />
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-mid)", marginBottom:8 }}>Attribute CP Cost Table</div>
                <div style={{ display:"flex", gap:0, marginBottom:16, fontFamily:"var(--font-body)", fontSize:11 }}>
                  {[3,4,5,6,7,8,9,10].map((lvl,i) => (
                    <div key={lvl} style={{ flex:1, textAlign:"center", padding:"4px 2px", background:i%2===0?"var(--paper-warm)":"var(--paper)", border:"1px solid var(--ink-faint)" }}>
                      <div style={{color:"var(--ink)",fontWeight:"bold"}}>{lvl}</div>
                      <div style={{color:"var(--ink-mid)"}}>{lvl} CP</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Rest Attributes">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:16, lineHeight:1.5 }}>
                  <strong>Void</strong> (starts at 2): Spend 1 Void during a Short Rest to refresh up to 3 attribute points.<br/>
                  <strong>Purpose</strong> (starts at 5): Spend 1 Purpose during a Long Rest to refresh up to 10 attribute points.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:20, justifyContent:"center" }}>
                  <StatBox label="Void" value={2} min={2} max={2} readOnly onChange={()=>{}} />
                  <StatBox label="Purpose" value={purposeVal} min={5} max={10} onChange={v => update("purposePurchased",v-5)} costNext={4} />
                </div>
              </Section>

              <Section title="Vitality">
                <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
                  <StatBox label="Vitality" value={vitalityVal} min={2} max={7} onChange={v => update("vitalityPurchased",v-2)} costNext={attrCost(char.vitalityPurchased)} />
                  <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--ink-mid)", maxWidth:300, lineHeight:1.6 }}>At 0 Vitality you fall unconscious. Uncalled hits = stable. Called/packet damage = unstable (1 min to die without aid). A Death Strike to torso kills outright.</div>
                </div>
              </Section>

              <Section title="Attribute Summary">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6, fontFamily:"var(--font-body)", fontSize:12 }}>
                  {([["Prowess",prowessVal,totalAttrCost(char.prowessPurchased),"var(--prowess)"],["Insight",insightVal,totalAttrCost(char.insightPurchased),"var(--insight)"],["Fortitude",fortitudeVal,totalAttrCost(char.fortitudePurchased),"var(--fortitude)"],["Void",2,0,null],["Purpose",purposeVal,char.purposePurchased*4,null],["Vitality",vitalityVal,totalAttrCost(char.vitalityPurchased),null]] as [string,number,number,string|null][]).map(([name,val,cost,ac]) => (
                    <div key={name} style={{ padding:"8px 10px", border:`1px solid ${ac || "var(--ink-faint)"}`, background:"var(--paper-warm)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{color: ac || "var(--ink-mid)", fontWeight: ac ? 600 : "normal"}}>{name}</span>
                      <span style={{fontFamily:"var(--font-display)",fontSize:18,color: ac || "var(--ink)"}}>{val}</span>
                      <span style={{fontSize:10,color:"var(--ink-faint)"}}>{cost>0?`${cost} CP`:"free"}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── TAB 3: EXCELLENCIES ── */}
          {tab === 3 && (
            <>
              <Section title="Excellencies (up to 3 at creation)" accent>
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10 }}>1st Excellency: 5 CP · 2nd: 6 CP · 3rd: 7 CP.</div>
                <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  {char.excellencies.map((e,i) => (
                    <div key={e} style={{ padding:"4px 10px", border:"2px solid var(--ink)", background:"var(--ink)", color:"var(--paper)", fontFamily:"var(--font-display)", fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                      <span>{e}</span><span style={{fontSize:10,color:"var(--ink-faint)"}}>({excellencyCost(i)} CP)</span>
                      <button onClick={() => removeExcellency(i)} style={{...btnStyle,width:14,height:14,fontSize:9,background:"transparent",border:"none",color:"var(--paper-warm)"}}>✕</button>
                    </div>
                  ))}
                  {totalExcellencies < 3 && (
                    <select defaultValue="" onChange={e => { addExcellency(e.target.value); e.target.value=""; }} style={{...inputStyle, flex:"none"}}>
                      <option value="">+ Add Excellency ({excellencyCost(char.excellencies.length)} CP)</option>
                      {ALL_EXCELLENCIES.filter(e => !char.excellencies.includes(e)).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  )}
                </div>
              </Section>

              <Section title="Excellency Skills">
                {char.excellencies.map(exclName => {
                  const skills = EXCELLENCY_SKILLS[exclName] || [];
                  const purchased = char.excellencySkillsPurchased[exclName] || [];
                  const totalSpent = purchased.reduce((s: number, e: PurchasedSkill) => s+e.cost, 0);
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => {
                    if (!canAdd(skill)) return;
                    setChar(c => ({ ...c, excellencySkillsPurchased: { ...c.excellencySkillsPurchased, [exclName]: [...(c.excellencySkillsPurchased[exclName]||[]), {name:skill.name,cost:skill.cost}] } }));
                  };
                  const removeSkill = (name: string) => {
                    setChar(c => {
                      const arr = c.excellencySkillsPurchased[exclName]||[];
                      const idx = [...arr].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                      if (idx===-1) return c;
                      return { ...c, excellencySkillsPurchased: { ...c.excellencySkillsPurchased, [exclName]: arr.filter((_: PurchasedSkill, i: number) => i!==arr.length-1-idx) } };
                    });
                  };
                  return (
                    <Section key={exclName} title={`${exclName} Skills`}>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                        <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)"}}>{totalSpent} CP spent</div>
                      </div>
                      {skills.length > 0 ? <SkillPickerList skills={skills} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                        : <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",fontStyle:"italic"}}>Skills unlocked in-game or via staff.</div>}
                    </Section>
                  );
                })}
                {char.excellencies.length === 0 && <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",fontStyle:"italic",padding:"8px 0"}}>Add an Excellency above to see its skills.</div>}
              </Section>

              <Section title="Hidden Excellencies" accent={false}>
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",marginBottom:10,padding:"6px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)",lineHeight:1.5}}>
                  ⚠ These Excellencies are only available to characters who have unlocked them in-game. Anyone may view and plan with them here.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  {char.hiddenExcellencies.map(e => (
                    <div key={e} style={{padding:"4px 10px",border:"2px solid var(--ink)",background:"var(--ink)",color:"var(--paper)",fontFamily:"var(--font-display)",fontSize:12,display:"flex",alignItems:"center",gap:8}}>
                      <span>{e}</span>
                      <span style={{fontSize:10,color:"var(--ink-faint)"}}>(1 CP)</span>
                      <button onClick={() => removeHiddenExcellency(e)} style={{...btnStyle,width:14,height:14,fontSize:9,background:"transparent",border:"none",color:"var(--paper-warm)"}}>✕</button>
                    </div>
                  ))}
                  {totalExcellencies < 3 && (
                    <select defaultValue="" onChange={e => { addHiddenExcellency(e.target.value); e.target.value=""; }} style={{...inputStyle,flex:"none"}}>
                      <option value="">+ Add Hidden Excellency (1 CP)</option>
                      {Object.keys(HIDDEN_EXCELLENCY_SKILLS).filter(e => !char.hiddenExcellencies.includes(e)).map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  )}
                </div>
                {char.hiddenExcellencies.map(exclName => {
                  const skills = HIDDEN_EXCELLENCY_SKILLS[exclName] || [];
                  const purchased = char.hiddenExcellencySkillsPurchased[exclName] || [];
                  const totalSpent = purchased.reduce((s: number, e: PurchasedSkill) => s + e.cost, 0);
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => {
                    if (!canAdd(skill)) return;
                    setChar(c => ({ ...c, hiddenExcellencySkillsPurchased: { ...c.hiddenExcellencySkillsPurchased, [exclName]: [...(c.hiddenExcellencySkillsPurchased[exclName]||[]), {name:skill.name,cost:skill.cost}] } }));
                  };
                  const removeSkill = (name: string) => {
                    setChar(c => {
                      const arr = c.hiddenExcellencySkillsPurchased[exclName] || [];
                      const idx = [...arr].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                      if (idx === -1) return c;
                      return { ...c, hiddenExcellencySkillsPurchased: { ...c.hiddenExcellencySkillsPurchased, [exclName]: arr.filter((_: PurchasedSkill, i: number) => i !== arr.length-1-idx) } };
                    });
                  };
                  return (
                    <Section key={exclName} title={`${exclName} Skills`}>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                        <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)"}}>{totalSpent} CP spent</div>
                      </div>
                      <SkillPickerList skills={skills} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                    </Section>
                  );
                })}
              </Section>
            </>
          )}

          {/* ── TAB 4: EXPRESSIONS ── */}
          {tab === 4 && (
            <>
              <Section title="Expressions (up to 2 at creation)" accent>
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:10, lineHeight:1.5 }}>1st Expression: 4 CP · 2nd: 5 CP.</div>
                <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  {char.expressions.map((e,i) => (
                    <div key={e} style={{ padding:"4px 10px", border:"2px solid var(--ink-mid)", fontFamily:"var(--font-display)", fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                      <span>{e}</span><span style={{fontSize:10,color:"var(--ink-mid)"}}>({expressionCost(i)} CP)</span>
                      <button onClick={() => removeExpression(i)} style={{...btnStyle,width:14,height:14,fontSize:9,background:"transparent",border:"none",color:"var(--ink-mid)"}}>✕</button>
                    </div>
                  ))}
                  {totalExpressions < 2 && (
                    <select defaultValue="" onChange={e => { addExpression(e.target.value); e.target.value=""; }} style={{...inputStyle,flex:"none"}}>
                      <option value="">+ Add Expression ({expressionCost(char.expressions.length)} CP)</option>
                      {EXPRESSIONS.filter(e => !char.expressions.includes(e)).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  )}
                </div>
              </Section>

              <Section title="Hidden Expressions" accent={false}>
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",marginBottom:10,padding:"6px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)",lineHeight:1.5}}>
                  ⚠ These Expressions are only available to characters who have unlocked them in-game. Anyone may view and plan with them here.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                  {char.hiddenExpressions.map(e => (
                    <div key={e} style={{padding:"4px 10px",border:"2px solid var(--ink-mid)",fontFamily:"var(--font-display)",fontSize:12,display:"flex",alignItems:"center",gap:8}}>
                      <span>{e}</span>
                      <span style={{fontSize:10,color:"var(--ink-mid)"}}>(1 CP)</span>
                      <button onClick={() => removeHiddenExpression(e)} style={{...btnStyle,width:14,height:14,fontSize:9,background:"transparent",border:"none",color:"var(--ink-mid)"}}>✕</button>
                    </div>
                  ))}
                  {totalExpressions < 2 && (
                    <select defaultValue="" onChange={e => { addHiddenExpression(e.target.value); e.target.value=""; }} style={{...inputStyle,flex:"none"}}>
                      <option value="">+ Add Hidden Expression (1 CP)</option>
                      {Object.keys(HIDDEN_EXPRESSION_SKILLS).filter(e => !char.hiddenExpressions.includes(e)).map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  )}
                </div>
                {char.hiddenExpressions.map(exprName => {
                  const skills = HIDDEN_EXPRESSION_SKILLS[exprName] || [];
                  const purchased = char.hiddenExpressionSkillsPurchased[exprName] || [];
                  const totalSpent = purchased.reduce((s: number, e: PurchasedSkill) => s + e.cost, 0);
                  const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                  const canAdd = (skill: SkillDef) => countOf(skill.name) === 0;
                  const addSkill = (skill: SkillDef) => {
                    if (!canAdd(skill)) return;
                    setChar(c => ({ ...c, hiddenExpressionSkillsPurchased: { ...c.hiddenExpressionSkillsPurchased, [exprName]: [...(c.hiddenExpressionSkillsPurchased[exprName]||[]), {name:skill.name,cost:skill.cost}] } }));
                  };
                  const removeSkill = (name: string) => {
                    setChar(c => {
                      const arr = c.hiddenExpressionSkillsPurchased[exprName] || [];
                      const idx = [...arr].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                      if (idx === -1) return c;
                      return { ...c, hiddenExpressionSkillsPurchased: { ...c.hiddenExpressionSkillsPurchased, [exprName]: arr.filter((_: PurchasedSkill, i: number) => i !== arr.length-1-idx) } };
                    });
                  };
                  return (
                    <Section key={exprName} title={`${exprName} Skills`}>
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                        <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)"}}>{totalSpent} CP spent</div>
                      </div>
                      <SkillPickerList skills={skills} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                    </Section>
                  );
                })}
              </Section>

              {char.expressions.map(exprName => {
                const skills = EXPRESSION_SKILLS[exprName] || [];
                const purchased = char.expressionSkillsPurchased[exprName] || [];
                const totalSpent = purchased.reduce((s: number, e: PurchasedSkill) => s+e.cost, 0);
                const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                const canAdd = (skill: SkillDef) => countOf(skill.name) === 0;
                const addSkill = (skill: SkillDef) => {
                  if (!canAdd(skill)) return;
                  setChar(c => ({ ...c, expressionSkillsPurchased: { ...c.expressionSkillsPurchased, [exprName]: [...(c.expressionSkillsPurchased[exprName]||[]), {name:skill.name,cost:skill.cost}] } }));
                };
                const removeSkill = (name: string) => {
                  setChar(c => {
                    const arr = c.expressionSkillsPurchased[exprName]||[];
                    const idx = [...arr].reverse().findIndex((e: PurchasedSkill) => e.name===name);
                    if (idx===-1) return c;
                    // If removing Third Aspect, clear aspect3
                    const upd: Partial<CharState> & { expressionSkillsPurchased: Record<string, PurchasedSkill[]> } = {
                      expressionSkillsPurchased: { ...c.expressionSkillsPurchased, [exprName]: arr.filter((_: PurchasedSkill, i: number) => i!==arr.length-1-idx) },
                    };
                    if (exprName==="Aspected" && name==="Third Aspect") upd.aspect3="";
                    if (exprName==="Savant" && name==="Skilled Learner") { upd.foundation2=""; upd.foundationSkillsPurchased=[]; upd.savantFreeSkill1=""; }
                    if (exprName==="Savant" && name==="Multi-talented") { upd.savantFreeSkill2=""; }
                    if (exprName==="Far Traveler" && name==="Dual Citizenship") { upd.culture2=""; upd.culture3=""; }
                    if (exprName==="Far Traveler" && name==="Multinational") upd.culture3="";
                    return { ...c, ...upd };
                  });
                };
                return (
                  <Section key={exprName} title={`${exprName} Skills`}>
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)"}}>{totalSpent} CP spent</div>
                    </div>
                    {exprName==="Aspected" && showThirdAspect && (
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)",marginBottom:8,padding:"6px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)"}}>
                        ✓ Third Aspect active. Select your 3rd Aspect on the Background tab.
                        {char.aspect3 ? ` Currently: ${char.aspect3}.` : " (not yet selected)"}
                      </div>
                    )}
                    {exprName==="Savant" && showSecondFoundation && (
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)",marginBottom:8,padding:"6px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)"}}>
                        ✓ Skilled Learner active. Select your 2nd Foundation on the Background tab.
                        {char.foundation2 ? ` Currently: ${char.foundation2} (${FOUNDATION_TYPES[char.foundation2]} type).` : " (not yet selected)"}
                        {char.foundation && char.foundation2 && FOUNDATION_TYPES[char.foundation] !== FOUNDATION_TYPES[char.foundation2]
                          ? " Different categories — skills from both lists are available."
                          : char.foundation && char.foundation2 ? " Same category — no additional skill list unlocked." : ""}
                      </div>
                    )}
                    {exprName==="Savant" && showSecondFoundation && (
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,marginBottom:8,padding:"8px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{color:"var(--ink-mid)"}}>Free Open Skill (Skilled Learner):</span>
                        <select
                          style={{fontFamily:"var(--font-body)",fontSize:11,border:"1px solid var(--ink-light)",background:"var(--paper)",color:"var(--ink)",padding:"3px 6px",cursor:"pointer",borderRadius:0}}
                          value={char.savantFreeSkill1||""}
                          onChange={e => {
                            const newSkill = e.target.value;
                            setChar(c => {
                              let openSkills = c.openSkillsPurchased;
                              if (newSkill) {
                                const firstIdx = openSkills.findIndex(s => s.name === newSkill);
                                if (firstIdx !== -1) openSkills = openSkills.filter((_, i) => i !== firstIdx);
                              }
                              return { ...c, savantFreeSkill1: newSkill, openSkillsPurchased: openSkills };
                            });
                          }}
                        >
                          <option value="">— choose free skill —</option>
                          {SAVANT_FREE_SKILL_OPTIONS.map(n => (
                            <option key={n} value={n} disabled={n === (char.savantFreeSkill2||"")}>{n}</option>
                          ))}
                        </select>
                        {char.savantFreeSkill1 && <span style={{color:"var(--fortitude)",fontSize:10}}>✓ {char.savantFreeSkill1} granted free</span>}
                      </div>
                    )}
                    {exprName==="Savant" && hasMultiTalented && (
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,marginBottom:8,padding:"8px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{color:"var(--ink-mid)"}}>Free Open Skill (Multi-talented):</span>
                        <select
                          style={{fontFamily:"var(--font-body)",fontSize:11,border:"1px solid var(--ink-light)",background:"var(--paper)",color:"var(--ink)",padding:"3px 6px",cursor:"pointer",borderRadius:0}}
                          value={char.savantFreeSkill2||""}
                          onChange={e => {
                            const newSkill = e.target.value;
                            setChar(c => {
                              let openSkills = c.openSkillsPurchased;
                              if (newSkill) {
                                const firstIdx = openSkills.findIndex(s => s.name === newSkill);
                                if (firstIdx !== -1) openSkills = openSkills.filter((_, i) => i !== firstIdx);
                              }
                              return { ...c, savantFreeSkill2: newSkill, openSkillsPurchased: openSkills };
                            });
                          }}
                        >
                          <option value="">— choose free skill —</option>
                          {SAVANT_FREE_SKILL_OPTIONS.map(n => (
                            <option key={n} value={n} disabled={n === (char.savantFreeSkill1||"")}>{n}</option>
                          ))}
                        </select>
                        {char.savantFreeSkill2 && <span style={{color:"var(--fortitude)",fontSize:10}}>✓ {char.savantFreeSkill2} granted free</span>}
                      </div>
                    )}
                    {exprName==="Far Traveler" && showSecondCulture && (
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)",marginBottom:8,padding:"6px 10px",background:"var(--paper-warm)",border:"1px dashed var(--ink-light)"}}>
                        ✓ Dual Citizenship active — select Culture 2 on the Background tab.
                        {char.culture2 ? ` Currently: ${char.culture2}.` : " (not yet selected)"}
                        {showThirdCulture && (char.culture3 ? ` Multinational active: Culture 3 = ${char.culture3}.` : " Multinational active — select Culture 3 on the Background tab.")}
                      </div>
                    )}
                    <SkillPickerList skills={skills} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeSkill} />
                  </Section>
                );
              })}
            </>
          )}

          {/* ── TAB 5: OPEN SKILLS ── */}
          {tab === 5 && (
            <Section title="Open Skills" accent>
              <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:12 }}>Available to all players. Click to purchase; click again to remove.</div>
              {(() => {
                const purchased = char.openSkillsPurchased;
                const totalSpent = purchased.reduce((s: number, e: PurchasedSkill) => s+e.cost, 0);
                const savantFreeSkills = [char.savantFreeSkill1||"", char.savantFreeSkill2||""].filter(Boolean);
                const freeItems = [
                  { slot: "Skilled Learner", name: char.savantFreeSkill1||"" },
                  { slot: "Multi-talented", name: char.savantFreeSkill2||"" },
                ].filter(item => item.name);
                const countOf = (name: string) => purchased.filter((e: PurchasedSkill) => e.name === name).length;
                const canAdd = (skill: SkillDef) => !savantFreeSkills.includes(skill.name) && countOf(skill.name) < (skill.maxCount||1);
                const addSkill = (skill: SkillDef) => { if (!canAdd(skill)) return; update("openSkillsPurchased",[...purchased,{name:skill.name,cost:skill.cost}]); };
                const removeOne = (name: string) => {
                  const idx = [...purchased].reverse().findIndex((e: PurchasedSkill) => e.name === name);
                  if (idx===-1) return;
                  update("openSkillsPurchased", purchased.filter((_: PurchasedSkill, i: number) => i!==purchased.length-1-idx));
                };
                return (
                  <>
                    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                      <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)"}}>{purchased.length + freeItems.length} skill{purchased.length+freeItems.length!==1?"s":""} · {totalSpent} CP spent</div>
                    </div>
                    {freeItems.length > 0 && (
                      <div style={{marginBottom:8,display:"flex",flexDirection:"column",gap:4}}>
                        {freeItems.map(item => {
                          const def = OPEN_SKILLS.find(s => s.name === item.name);
                          if (!def) return null;
                          return (
                            <div key={item.slot} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",background:"var(--ink)",border:"1px solid var(--ink)"}}>
                              <div style={{minWidth:24,display:"flex",alignItems:"center",justifyContent:"center",paddingTop:2,flexShrink:0}}>
                                <div style={{width:14,height:14,border:"2px solid var(--paper-warm)",background:"var(--paper-warm)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{color:"var(--ink)",fontSize:9,lineHeight:1}}>✓</span>
                                </div>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap"}}>
                                  <span style={{fontFamily:"var(--font-display)",fontSize:12,color:"var(--paper-warm)"}}>{def.name}</span>
                                  <span style={{fontSize:9,padding:"1px 5px",fontStyle:"italic",background:"rgba(255,255,255,0.15)",color:"var(--paper-warm)"}}>free · {item.slot}</span>
                                  {def.verbal && def.verbal !== "N/A" && <span style={{fontSize:9,fontStyle:"italic",color:"rgba(255,255,255,0.5)"}}>"{def.verbal}"</span>}
                                </div>
                                <div style={{fontSize:10,marginTop:2,lineHeight:1.4,color:"rgba(255,255,255,0.7)"}}>{def.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <SkillPickerList skills={OPEN_SKILLS} countOf={countOf} canAdd={canAdd} onAdd={addSkill} onRemove={removeOne} />
                  </>
                );
              })()}
            </Section>
          )}

          {/* ── TAB 6: SPELLS & ABILITIES ── */}
          {tab === 6 && (
            <>
              <Section title="Spellcasting & Abilities Summary" accent>
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", lineHeight:1.7 }}>
                  <strong>Method:</strong> Verbal (3s incantation), Somatic (visible 3s gesture), or Preparation (Alchemy/Tinkering/Arcaneering).<br/>
                  <strong>Packet Flurry:</strong> You may throw 3 packets without a break. After 3 you must roleplay ≥3 seconds to reset.<br/>
                  <strong>Casting Rule:</strong> By default, both hands must be free of everything except packets while casting.
                </div>
              </Section>

              <Section title="Thread Skills">
                <div style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--ink-mid)", marginBottom:8, lineHeight:1.5 }}>
                  Thread Skills enhance other skills. You may apply up to 3 Thread Skills to a single effect (plus 1 Extra Thread Skill). Thread Skills cannot be applied to uncalled damage, grants, or item effects.
                </div>
                {(() => {
                  const threadSkills: { name: string; source: string; description: string; verbal: string; isExtra: boolean }[] = [];
                  const allSourceSkills = [
                    ...Object.entries(char.excellencySkillsPurchased).flatMap(([exclName,arr]) => arr.map(s => ({...s, source:exclName, skillDefs:EXCELLENCY_SKILLS[exclName]||[]}))),
                    ...Object.entries(char.expressionSkillsPurchased).flatMap(([exprName,arr]) => arr.map(s => ({...s, source:exprName, skillDefs:EXPRESSION_SKILLS[exprName]||[]}))),
                    ...Object.entries(char.hiddenExcellencySkillsPurchased||{}).flatMap(([exclName,arr]) => (arr as {name:string,cost:number}[]).map(s => ({...s, source:`${exclName} (Hidden)`, skillDefs:HIDDEN_EXCELLENCY_SKILLS[exclName]||[]}))),
                    ...Object.entries(char.hiddenExpressionSkillsPurchased||{}).flatMap(([exprName,arr]) => (arr as {name:string,cost:number}[]).map(s => ({...s, source:`${exprName} (Hidden)`, skillDefs:HIDDEN_EXPRESSION_SKILLS[exprName]||[]}))),
                    ...char.domainSkillsPurchased.map(s => ({...s, source:`${char.domain} Domain`, skillDefs:DOMAIN_SKILLS[char.domain]||[]})),
                    ...char.aspectSkillsPurchased.map(s => ({...s, source:"Aspect", skillDefs:ASPECT_SKILLS})),
                    ...char.foundationSkillsPurchased.map(s => { const defs = getFoundationSkills(); return {...s, source:`${char.foundation} Foundation`, skillDefs:defs}; }),
                    ...char.cultureSkillsPurchased.map(s => ({...s, source:`${char.culture} Culture`, skillDefs:CULTURE_SKILLS})),
                  ];
                  allSourceSkills.forEach(({name, source, skillDefs}) => {
                    const def = skillDefs.find(d => d.name === name);
                    if (!def) return;
                    const combined = (def.description||"") + " " + (def.attribute||"") + " " + (def.verbal||"");
                    const isExtra = /extra thread/i.test(combined);
                    const isThread = isExtra || /thread skill/i.test(combined);
                    if (isThread) threadSkills.push({name, source, description:def.description, verbal:def.verbal, isExtra});
                  });

                  if (threadSkills.length === 0) {
                    return <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",fontStyle:"italic",padding:"6px 0"}}>No Thread Skills purchased yet. Select skills marked as "Thread Skill" to see them listed here automatically.</div>;
                  }
                  return (
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:6}}>
                      {threadSkills.map((ts,i) => (
                        <div key={i} style={{padding:"8px 10px",background:"var(--paper-warm)",border:"1px solid var(--ink-faint)",display:"flex",gap:10,alignItems:"flex-start"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap"}}>
                              <span style={{fontFamily:"var(--font-display)",fontSize:12,color:"var(--ink)"}}>{ts.name}</span>
                              {ts.isExtra
                                ? <span style={{fontSize:9,padding:"1px 5px",background:"var(--red)",color:"white"}}>Extra Thread</span>
                                : <span style={{fontSize:9,padding:"1px 5px",background:"var(--ink)",color:"var(--paper)"}}>Thread Skill</span>}
                              <span style={{fontSize:9,fontStyle:"italic",color:"var(--ink-mid)"}}>from {ts.source}</span>
                              {ts.verbal && ts.verbal !== "N/A" && <span style={{fontSize:9,fontStyle:"italic",color:"var(--ink-mid)"}}>"{ts.verbal}"</span>}
                            </div>
                            {ts.description && <div style={{fontSize:10,color:"var(--ink-mid)",marginTop:2,lineHeight:1.4}}>{ts.description}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)",marginTop:10,lineHeight:1.5}}>Additional notes on Thread Skill combinations:</div>
                <textarea value={char.threadNotes||""} onChange={e => update("threadNotes",e.target.value)} placeholder="e.g. Storm of Blows + Enhance Lightning = extra attack on multi-attack skills..." style={{...inputStyle,width:"100%",minHeight:60,resize:"vertical",lineHeight:1.6,marginTop:6}} />
              </Section>

              <Section title="Ability Tracker">
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",marginBottom:10}}>Track uses of per-rest and per-event abilities.</div>
                <textarea value={char.abilitiesNotes} onChange={e => update("abilitiesNotes",e.target.value)} placeholder={`Example:\n[ ] Immolate (1x/event) — "Death by Fire"\n[ ][ ] Blast of Flame (1 Insight each) — "3 Damage by Fire"\n[ ][ ][ ] Water's Determination heals (Short Rest) — "Heal 1 by Faith"`} style={{...inputStyle,width:"100%",minHeight:200,resize:"vertical",lineHeight:1.7,fontFamily:"var(--font-body)",fontSize:12}} />
              </Section>

              <Section title="Alchemy / Crafting">
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",lineHeight:1.7}}><strong>Crafted items last 1 event.</strong> They require attribute expenditure + 1 Drakar (minimum) per item.</div>
                <textarea value={char.craftingNotes||""} onChange={e => update("craftingNotes",e.target.value)} placeholder="List your known formulas, components on hand, or crafting plans..." style={{...inputStyle,width:"100%",minHeight:80,resize:"vertical",lineHeight:1.6,marginTop:10}} />
              </Section>
            </>
          )}

          {/* ── TAB 8: EXPORT / PRINT ── */}
          {tab === 8 && (
            <ExportPanel char={char} setChar={setChar} />
          )}

          {/* ── TAB 7: NOTES ── */}
          {tab === 7 && (
            <>
              <Section title="Character History & Background" accent>
                <textarea value={char.history||""} onChange={e => update("history",e.target.value)} placeholder="Write your character's history here. Submitting a character history is worth 2 bonus CP!" style={{...inputStyle,width:"100%",minHeight:160,resize:"vertical",lineHeight:1.7}} />
              </Section>
              <Section title="Contacts & Courier Network">
                <textarea value={char.contactsNotes||""} onChange={e => update("contactsNotes",e.target.value)} placeholder="List known contacts, their location, and what they know..." style={{...inputStyle,width:"100%",minHeight:80,resize:"vertical",lineHeight:1.6}} />
              </Section>
              <Section title="Info Skills & Research">
                <div style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-mid)",marginBottom:8,lineHeight:1.5}}>You may use <strong>2 Info Skills</strong> per event. First is free; second has an in-game cost.</div>
                <textarea value={char.infoSkillsNotes||""} onChange={e => update("infoSkillsNotes",e.target.value)} placeholder="Research topics, pending questions, letters to contacts, holding usage..." style={{...inputStyle,width:"100%",minHeight:80,resize:"vertical",lineHeight:1.6}} />
              </Section>
              <Section title="Currency & Holdings">
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                  <TextInput label="Drakar (1)" value={char.drakar||""} onChange={v=>update("drakar",v)} placeholder="0" />
                  <TextInput label="Ketch (10 Drakar)" value={char.ketch||""} onChange={v=>update("ketch",v)} placeholder="0" />
                  <TextInput label="Reel (100 Drakar)" value={char.reel||""} onChange={v=>update("reel",v)} placeholder="0" />
                </div>
                <TextInput label="Holding Description" value={char.holding||""} onChange={v=>update("holding",v)} placeholder="e.g. Small alchemical shop in Rues..." wide />
              </Section>
              <Section title="General Notes">
                <textarea value={char.notes} onChange={e => update("notes",e.target.value)} placeholder="Plot threads, goals, relationships, items to craft, things to investigate..." style={{...inputStyle,width:"100%",minHeight:160,resize:"vertical",lineHeight:1.7}} />
              </Section>
              <Section title="CP Log">
                <textarea value={char.cpLog||""} onChange={e => update("cpLog",e.target.value)} placeholder="Event 1 (attended): +1 CP&#10;Event 1 (PEL): +0.5 CP&#10;Character history submitted: +2 CP" style={{...inputStyle,width:"100%",minHeight:100,resize:"vertical",lineHeight:1.7}} />
                <div style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-mid)",marginTop:8,lineHeight:1.5}}>CP Cap: 100 (increases by 15 each year — 115 in 2027).</div>
              </Section>
            </>
          )}

        </div>
      </div>
    </>
  );
}
