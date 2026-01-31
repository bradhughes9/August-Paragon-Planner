/**
 * Data source: https://wiki.august.games/wiki/Paragon_League
 * Tool includes:
 * - Tier relics (Tier 1-3 + Tier 5 shown on page)
 * - Revealed relics listed as "Unknown Tier" on the wiki
 * - Tier passives where available
 *
 * Note: Tier 4/6/7 are incomplete on the wiki right now (???), so:
 * - Tier 4 defaults to: Treasure Seeker, Prestigious, Luck Of The Dwarves (per user "final sneak peek")
 * - Tier 7 defaults to: Wrath, Vampyrism, Enhanced Executioner (per user "final sneak peek")
 */

// Map relic names to image filenames
const RELIC_IMAGES = {
  "Fluid Strikes": "50px-Paragon_fluidstrikes.png",
  "Quick Shot": "50px-Paragon_quickshot.png",
  "Double Cast": "50px-Paragon_doublecast.png",
  "Endless Harvest": "50px-Paragon_endlessharvest.png",
  "Production Prodigy": "50px-Paragon_productionprodigy.png",
  "Slayer Master": "50px-Paragon_slayermaster.png",
  "Summoner": "50px-Paragon_summoner.png",
  "Absolute Unit": "50px-Paragon_absolute_unit.png",
  "Ferality": "50px-Paragon_ferality.png",
  "Paladin": "50px-Paragon_paladin.png",
  "Hands Free": "50px-Paragon_handsfree.png",
  "Reloaded": "50px-Paragon_reloaded.png",
  "Treasure Seeker": "50px-Paragon_treasure_seeker.png",
  "Prestigious": "50px-Paragon_prestigious.png",
  "Luck Of The Dwarves": "50px-Paragon_luckofthedwarves.png",
  "Wrath": "50px-Paragon_wrath.png",
  "Vampyrism": "50px-Paragon_vampyrism.png",
  "Enhanced Executioner": "50px-Paragon_enhancedexecutioner.png"
};

function getRelicImage(name){
  return RELIC_IMAGES[name] ? `img/${RELIC_IMAGES[name]}` : null;
}

// Cached DOM elements (populated on init)
const DOM = {};

// Debounce helper
function debounce(fn, ms = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Batch render to avoid multiple reflows
let renderQueued = false;
function queueRender(...fns) {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    fns.forEach(fn => fn());
    renderQueued = false;
  });
}

const TIERS = [
  { tier: 1, points: "1,400", passives: [
    "Gain 5 Paragon Points",
    "+25% drop rate bonus",
    "+25% more defence penetration",
    "+5 minimum hit",
    "Auto bank all herbs and currency"
  ]},
  { tier: 2, points: "5,600", passives: [
    "Gain 5 Paragon Points",
    "+50% XP boost",
    "1% chance to spawn the Spirit of Seren when gathering",
    "60% chance to save 10% of resources when crafting",
    "+5 slayer task picks per day",
    "Save 95% of runes/ammo/charges",
    "Unlock bonfires"
  ]},
  { tier: 3, points: "16,000", passives: [
    "Gain 5 Paragon Points",
    "+25% drop rate (Total of +50%)",
    "NPC aggression lasts 5x longer",
    "Auto bank all keys, slayer parts, and slayer boxes"
  ]},
  { tier: 4, points: "39,000", passives: [
    "Gain 5 Paragon Points",
    "+50% XP boost (Total of +100%)",
    "+60% chance to successfully gather",
    "2x the amount of automatic gathers before stopping gathering",
    "2x chance to receive Pets"
  ]},
  { tier: 5, points: "69,000", passives: [
    "Gain 5 Paragon Points",
    "+25% drop rate (Total of +75%)",
    "Access to the Banker's note",
    "Gather noted resources",
    "Craft 3 extra runes per essence"
  ]},
  { tier: 6, points: "124,000", passives: [
    "Gain 150 Paragon Points between Tier 6 and Tier 7",
    "+50% XP boost (Total of +150%)",
    "+50% drop rate (Total of +125%)",
    "Toxic orbs are not consumed on use",
    "Ignis teleport scrolls are not consumed on use"
  ]},
  { tier: 7, points: "180,000", passives: [
    "Gain 150 Paragon Points between Tier 6 and Tier 7",
    "+50% drop rate",
    "Enter ToA Warden without your key being consumed"
  ]},
  { tier: 8, points: "250,000", passives: [
    "Gain a 1-off singular perk reset.",
    "+75% drop rate"
  ]}
];

const RELICS = {
  // Tier 1
  "Fluid Strikes": {
    tier: 1,
    effects: [
      "Melee attacks are 2x faster, rounding down (5-tick → 2-tick).",
      "Extra damage vs larger targets (e.g., 5x5: 25% extra damage).",
      "With defender: more damage scaling by defender type.",
      "With shield: 25% chance to block incoming damage completely.",
      "With stab weapon: 25% chance to bleed (DoT)."
    ],
    tags: ["Melee", "Speed", "Tank"]
  },
  "Quick Shot": {
    tier: 1,
    effects: [
      "Ranged attacks are 2x faster, rounding down (5-tick → 2-tick).",
      "10% chance headshot (double damage).",
      "Up to +50% damage at max range with longbow.",
      "Up to +25% damage at minimum range with shortbow.",
      "Crossbow bolts 2x more likely to proc."
    ],
    tags: ["Ranged", "Speed", "DPS"]
  },
  "Double Cast": {
    tier: 1,
    effects: [
      "Magic attacks are 2x faster, rounding down (5-tick → 2-tick).",
      "25% chance to randomly freeze, burn, or sunder enemy armour.",
      "Ice spells ignore all target defences.",
      "Blood spells heal 20% more.",
      "Summon a Bloodworm and a Guardian to fight alongside you.",
      "Guardians swap to optimal combat style."
    ],
    tags: ["Magic", "Speed", "Utility"]
  },

  // Tier 2
  "Endless Harvest": {
    tier: 2,
    effects: [
      "Repeat gathering actions indefinitely (mining/fishing/woodcutting/thieving) with inventory space.",
      "Farming patches grow every tick.",
      "Gathering nodes never deplete.",
      "Given: Echo pickaxe/axe/harpoon.",
      "While equipped: 100% chance bank resources; 15% auto-process; 50% 1 tick quicker; 25% double resource (double XP).",
      "Works even for thieving with pickaxe equipped."
    ],
    tags: ["Skilling", "AFK", "Speed"]
  },
  "Production Prodigy": {
    tier: 2,
    effects: [
      "Expedite all production (craft queued items immediately) with 5% chance to double each item.",
      "When you save resources, save 60% instead of 10%.",
      "+10% crafting success chance.",
      "No tools required for crafting items.",
      "Crushable items crushable while noted (e.g., noted luminite, barrows items, superior bones).",
      "Herblore secondaries never consumed.",
      "Always mix 4-dose potions; harvest potions instead of herbs when farming."
    ],
    tags: ["Production", "Bank", "Efficiency"]
  },
  "Slayer Master": {
    tier: 2,
    effects: [
      "+75% more Slayer points on task completion; +60% more points for task streaks.",
      "Infinitely pick Slayer tasks.",
      "Superior Slayer creatures spawn 3x more often.",
      "Slayer Helmet accuracy/damage buffs are 2x stronger.",
      "Unlock Raid tasks and Nex tasks from Nixite boss slayer.",
      "Given: Slayer helm charm (gives slayer helm buff from inventory)."
    ],
    tags: ["Slayer", "PvM", "Points"]
  },

  // Tier 3
  "Summoner": {
    tier: 3,
    effects: [
      "Summon 3 Bloodworms & 3 Guardians to fight alongside you.",
      "Guardians auto-swap to optimal combat style.",
      "Combat pets attack 2x faster.",
      "All combat pets: +3 attack range, +5 max hit, ignore all target defences.",
      "Pets always run; teleport into range when needed.",
      "Note: You do not gain XP for pet damage."
    ],
    tags: ["PvM", "Pets", "Army"]
  },
  "Absolute Unit": {
    tier: 3,
    effects: [
      "Regenerate 10% max HP (min 5) and 3 Prayer points every 3 seconds.",
      "With shield: reduce all damage taken (except poison/venom) by 10.",
      "Reflect 5x damage you would take (before reductions).",
      "Reflect boosted: +50% with ring of recoil, +100% with ring of suffering.",
      "Recoil/suffering rings do not lose charges.",
      "Given: Corrupted shark (infinite eats, 20 hp per bite, overheals like anglerfish).",
      "Note: Combat XP granted for your current style when you receive damage."
    ],
    tags: ["Tank", "AFK PvM", "Reflect"]
  },
  "Ferality": {
    tier: 3,
    effects: [
      "25% chance on hit to unleash flurry: remove attack delay for next 2 attacks.",
      "+5 minimum hit.",
      "50% chance to splash up to 50% of damage to up to 9 nearby targets (multi-way).",
      "Deal 30% more damage, take 30% more damage.",
      "Note: AoE damage does not grant XP."
    ],
    tags: ["DPS", "AoE", "Risk"]
  },

  // Tier 5
  "Paladin": {
    tier: 5,
    effects: [
      "Holy hammers spin around you, attacking enemies you can attack every tick, dealing up to your current prayer bonus as typeless damage.",
      "Prayers are twice as effective, and drain prayer points twice as slowly.",
      "Higher prayer bonus increases max hit.",
      "Whenever you restore prayer points, heal hitpoints by the same amount."
    ],
    tags: ["Prayer", "PvM", "Sustain"]
  },
  "Hands Free": {
    tier: 5,
    effects: [
      "While online: farming plots auto-harvest and replant if seeds are in bank.",
      "While online: clue scroll rewards auto-collected and restarted if you have another of that clue in bank.",
      "Gifts from Seren auto-claimed when gathering.",
      "All loot auto-banked if you're not a UIM.",
      "Bones auto-buried and ashes auto-scattered for 5x XP."
    ],
    tags: ["AFK", "QoL", "Skilling"]
  },
  "Reloaded": {
    tier: 5,
    effects: ["Pick another perk from tiers 1–4."],
    tags: ["Flexible", "Meta"]
  },

  // Revealed (listed as Unknown Tier on wiki; tool assigns by default per your note)
  "Treasure Seeker": {
    tier: "reveal",
    assignedDefaultTier: 4,
    effects: [
      "Acquire clues from PvM/Mining/Fishing/Woodcutting at 10x the regular rate.",
      "Always receive a clue scroll drop from superior slayer creatures.",
      "Clues complete 50% faster.",
      "25% chance when opening a casket to receive another casket; additional 15% chance to receive a higher tier (if applicable)."
    ],
    tags: ["Clues", "Drops", "Chain"]
  },
  "Prestigious": {
    tier: "reveal",
    assignedDefaultTier: 4,
    effects: [
      "Gain double XP.",
      "On level up: 25% chance to level up again.",
      "On prestige: 15% chance to prestige again.",
      "Permanent +17 level boost to every skill.",
      "Increase prestige cap by 3.",
      "Bypass all equip level requirements."
    ],
    tags: ["XP", "Progression", "Unlocks"]
  },
  "Luck Of The Dwarves": {
    tier: "reveal",
    assignedDefaultTier: 4,
    effects: [
      "30% chance to roll twice on any loot table (or roll twice as many times if you'd normally roll many times).",
      "50% increased drop rate.",
      "3.5% chance to spawn a treasure goblin when killing monsters above 100 combat.",
      "Treasure goblins drop coins/gems/rare items.",
      "Priority targeting for treasure goblins over existing target.",
      "Killing treasure goblins can spawn more; otherwise 3-minute cooldown on finding another."
    ],
    tags: ["Drops", "PvM", "Money"]
  },
  "Wrath": {
    tier: "reveal",
    assignedDefaultTier: 6,
    effects: [
      "Cannot use overhead prayers.",
      "No longer gain defensive bonuses from equipment.",
      "Ignore all damage reduction and overheads against targets."
    ],
    tags: ["Glass cannon", "Bypass", "PvM"]
  },
  "Vampyrism": {
    tier: "reveal",
    assignedDefaultTier: 6,
    effects: [
      "Heal for 10% of damage dealt to enemies.",
      "If you hit a 15, you will heal for 1 HP, with a 50% chance to heal for another 1 HP.",
      "If you hit a 19, you will heal for 1 HP, with a 90% chance to heal for another 1 HP.",
      "Life-steal from items is doubled.",
      "Always gain effects of NPC weakness exploitation regardless of combat style and the target's actual weaknesses."
    ],
    tags: ["Sustain", "PvM", "Universal"]
  },
  "Enhanced Executioner": {
    tier: "reveal",
    assignedDefaultTier: 6,
    effects: [
      "Given: 1x Sage's axe.",
      "Procs automatically while the axe is in inventory.",
      "If it procs from inventory while using melee, grants melee XP.",
      "Up to 1000 damage per hit (instead of 750).",
      "Procs at 30% target max HP (instead of 20%).",
      "No damage to targets immune to ranged; ranged damage reduction applies."
    ],
    tags: ["Execute", "Burst", "Bossing"]
  }
};

// Tier options mapping.
// Tier 4/6 are set per wiki, Tier 7 relics not yet revealed
const DEFAULT_TIER_OPTIONS = {
  1: ["Fluid Strikes","Quick Shot","Double Cast"],
  2: ["Endless Harvest","Production Prodigy","Slayer Master"],
  3: ["Summoner","Absolute Unit","Ferality"],
  4: ["Treasure Seeker","Prestigious","Luck Of The Dwarves"],
  5: ["Paladin","Hands Free","Reloaded"],
  6: ["Wrath","Vampyrism","Enhanced Executioner"],
  7: ["(Unknown relic 1)","(Unknown relic 2)","(Unknown relic 3)"],
  8: ["(Tier 8 relic 1)","(Tier 8 relic 2)","(Tier 8 relic 3)"]
};

const STORAGE_KEY = "paragon_relic_route_planner_v2";

function clampTier(t){ return Math.min(8, Math.max(1, t)); }

function toast(msg){
  const el = DOM.toast || document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.style.display="none", 2200);
}

function defaultState(){
  const picks = {};
  const notes = {};
  const tierOptions = structuredClone(DEFAULT_TIER_OPTIONS);

  // Set initial pick for each tier to first option (if present)
  for (let t=1; t<=8; t++){
    picks[t] = tierOptions[t]?.[0] ?? "";
    notes[t] = "";
  }
  return {
    planName: "",
    globalNotes: "",
    activeTier: 1,
    currentTier: 8, // How far you've progressed in the league
    tierOptions,
    picks,
    notes,
    reloadedPick: "", // Extra pick from Reloaded (tier 5)
    updatedAt: Date.now()
  };
}

let STATE = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);

    // soft-migrate missing keys
    const base = defaultState();
    const merged = { ...base, ...parsed };
    merged.tierOptions = { ...base.tierOptions, ...(parsed.tierOptions || {}) };
    merged.picks = { ...base.picks, ...(parsed.picks || {}) };
    merged.notes = { ...base.notes, ...(parsed.notes || {}) };
    merged.activeTier = clampTier(merged.activeTier || 1);
    return merged;
  }catch(e){
    return defaultState();
  }
}

// Debounced save to avoid excessive localStorage writes
const _saveState = debounce(() => {
  STATE.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  if (DOM.saveState) {
    DOM.saveState.textContent = "Saved";
    DOM.saveState.className = "pill good";
  }
}, 500);

function saveState(){
  _saveState();
}

function dirty(){
  if (DOM.saveState) {
    DOM.saveState.textContent = "Unsaved";
    DOM.saveState.className = "pill warn";
  }
}

function setActiveTier(t){
  STATE.activeTier = clampTier(t);
  renderDetail();
  renderCompare();
  renderTiers();
  saveState();
}

function tierMeta(t){
  return TIERS.find(x=>x.tier===t);
}

function relicInfo(name){
  return RELICS[name] || null;
}

function renderTiers(){
  const host = DOM.tiers || document.getElementById("tiers");
  host.innerHTML = "";

  for (let t=1; t<=8; t++){
    const meta = tierMeta(t);
    const card = document.createElement("div");
    card.className = "tier";
    if (STATE.activeTier === t){
      card.classList.add("active");
    }
    card.addEventListener("click", (e)=>{
      // avoid click hijacking when interacting with textarea or buttons
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON" || e.target.closest(".relic-icon-btn")) return;
      setActiveTier(t);
    });

    const head = document.createElement("div");
    head.className = "tierhead";
    
    // Tier 7 and 8 have no relic choices
    const hasRelicChoices = t <= 6;
    const showPick = hasRelicChoices && STATE.picks[t];
    
    head.innerHTML = `
      <div>
        <div class="tiername">Tier ${t}</div>
        <div class="points">${meta?.points ? `${meta.points} points` : ""}</div>
      </div>
      <span class="pill ${showPick ? "good" : ""}">${hasRelicChoices ? (showPick ? "Selected" : "—") : "Passive"}</span>
    `;
    card.appendChild(head);

    // Relic selection with icons (only for tiers 1-6)
    if (hasRelicChoices) {
      const relicSelector = document.createElement("div");
      relicSelector.className = "relic-selector";
      const opts = STATE.tierOptions[t] || [];
    
      if (opts.length > 0 && !opts[0].startsWith("(")){
      // Show icon buttons for known relics
      const iconGrid = document.createElement("div");
      iconGrid.className = "relic-icon-grid";
      
      for (const relicName of opts){
        const iconBtn = document.createElement("button");
        iconBtn.className = "relic-icon-btn";
        if (STATE.picks[t] === relicName){
          iconBtn.classList.add("selected");
        }
        
        const info = relicInfo(relicName);
        const img = getRelicImage(relicName);
        if (img){
          const imgEl = document.createElement("img");
          imgEl.src = img;
          imgEl.alt = relicName;
          imgEl.className = "relic-icon";
          iconBtn.appendChild(imgEl);
        } else {
          iconBtn.textContent = relicName.substring(0, 2);
          iconBtn.className += " no-image";
        }
        
        const label = document.createElement("span");
        label.className = "relic-label";
        label.textContent = relicName;
        iconBtn.appendChild(label);
        
        // Add tooltip with relic description
        
        iconBtn.addEventListener("click", (e)=>{
          e.stopPropagation();
          STATE.picks[t] = relicName;
          // Clear reloadedPick if Reloaded is deselected in tier 5
          if (t === 5 && relicName !== "Reloaded") {
            STATE.reloadedPick = "";
          }
          dirty(); saveState();
          renderKPIs();
          if (STATE.activeTier === t){
            renderDetail();
            renderCompare();
          }
          renderTiers();
          renderBonusSummary();
        });
        
        iconGrid.appendChild(iconBtn);
      }
      relicSelector.appendChild(iconGrid);
    } else {
      // Fallback to dropdown for unknown relics
      const sel = document.createElement("select");
      sel.className = "relic-select-fallback";
      for (const o of opts){
        const op = document.createElement("option");
        op.value = o;
        op.textContent = o;
        if (STATE.picks[t] === o) op.selected = true;
        sel.appendChild(op);
      }
      sel.addEventListener("change", ()=>{
        STATE.picks[t] = sel.value;
        // Clear reloadedPick if Reloaded is deselected in tier 5
        if (t === 5 && sel.value !== "Reloaded") {
          STATE.reloadedPick = "";
        }
        dirty(); saveState();
        renderKPIs();
        if (STATE.activeTier === t){
          renderDetail();
          renderCompare();
        }
        renderTiers();
        renderBonusSummary();
      });
      relicSelector.appendChild(sel);
      }
    
      card.appendChild(relicSelector);
      
      // Reloaded special: if tier 5 has Reloaded selected, show extra picker
      if (t === 5 && STATE.picks[5] === "Reloaded") {
        const reloadedDiv = document.createElement("div");
        reloadedDiv.className = "reloaded-picker";
        
        // Get available relics from tiers 1-4 that haven't been picked
        const availableRelics = [];
        for (let tier = 1; tier <= 4; tier++) {
          const tierOpts = STATE.tierOptions[tier] || [];
          for (const relic of tierOpts) {
            if (STATE.picks[tier] !== relic && !relic.startsWith("(")) {
              availableRelics.push({ tier, name: relic });
            }
          }
        }
        
        const headerDiv = document.createElement("div");
        headerDiv.className = "reloaded-header";
        headerDiv.innerHTML = `
          <span class="pill accent">Reloaded Bonus</span>
          <span class="small">Pick another relic from Tiers 1-4</span>
        `;
        reloadedDiv.appendChild(headerDiv);
        
        // Use icon grid like regular relic selection
        const iconGrid = document.createElement("div");
        iconGrid.className = "relic-icon-grid reloaded-grid";
        
        for (const { tier, name } of availableRelics) {
          const iconBtn = document.createElement("button");
          iconBtn.className = "relic-icon-btn";
          if (STATE.reloadedPick === name) {
            iconBtn.classList.add("selected");
          }
          
          const img = getRelicImage(name);
          if (img) {
            const imgEl = document.createElement("img");
            imgEl.src = img;
            imgEl.alt = name;
            imgEl.className = "relic-icon";
            iconBtn.appendChild(imgEl);
          } else {
            iconBtn.textContent = name.substring(0, 2);
            iconBtn.className += " no-image";
          }
          
          const label = document.createElement("span");
          label.className = "relic-label";
          label.textContent = name;
          iconBtn.appendChild(label);
          
          const tierLabel = document.createElement("span");
          tierLabel.className = "reloaded-tier-label";
          tierLabel.textContent = `T${tier}`;
          iconBtn.appendChild(tierLabel);
          
          iconBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            STATE.reloadedPick = name;
            dirty(); saveState();
            renderDetail();
            renderTiers();
            renderBonusSummary();
          });
          
          iconGrid.appendChild(iconBtn);
        }
        
        reloadedDiv.appendChild(iconGrid);
        card.appendChild(reloadedDiv);
      }
    }

    // Tier passives display
    if (meta?.passives && meta.passives.length > 0){
      const passivesDiv = document.createElement("div");
      passivesDiv.className = "tier-passives-display";
      passivesDiv.innerHTML = `
        <div class="passives-header">
          <span class="pill">Tier Passives</span>
        </div>
        <ul class="passives-list">
          ${meta.passives.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
      `;
      card.appendChild(passivesDiv);
    }

    // Notes
    const note = document.createElement("textarea");
    note.placeholder = "Add notes for this tier...";
    note.value = STATE.notes[t] || "";
    note.addEventListener("input", ()=>{
      STATE.notes[t] = note.value;
      dirty(); saveState();
      if (STATE.activeTier === t) renderDetail();
    });
    card.appendChild(note);

    host.appendChild(card);
  }
}

function summarizeNumericBonuses(){
  // light heuristic: parse drop rate + xp boost totals if present
  let drop = 0;
  let xp = 0;

  // Tier passives have both incremental and "Total of" wording.
  // We'll take the highest "Total of" we see for each category, otherwise sum simple +X%.
  let dropTotal = null;
  let xpTotal = null;

  for (const meta of TIERS){
    for (const p of (meta.passives || [])){
      // XP
      const xpTotalMatch = p.match(/XP boost\s*\(Total of \+(\d+)%\)/i);
      if (xpTotalMatch) xpTotal = Math.max(xpTotal ?? 0, Number(xpTotalMatch[1]));
      const xpMatch = p.match(/^\+(\d+)% XP boost$/i);
      if (xpMatch) xp += Number(xpMatch[1]);

      // Drop
      const dropTotalMatch = p.match(/drop rate.*\(Total of \+(\d+)%\)/i);
      if (dropTotalMatch) dropTotal = Math.max(dropTotal ?? 0, Number(dropTotalMatch[1]));
      const dropMatch = p.match(/^\+(\d+)% drop rate/i);
      if (dropMatch && !/Total of/i.test(p)) drop += Number(dropMatch[1]);
    }
  }

  return {
    xpBoostTotal: xpTotal ?? xp,
    dropRateTotal: dropTotal ?? drop
  };
}

function renderKPIs(){
  const host = DOM.kpis || document.getElementById("kpis");
  host.innerHTML = "";

  const numeric = summarizeNumericBonuses();
  const currentTier = STATE.currentTier || 8;

  const chosen = [];
  for (let t=1; t<=Math.min(6, currentTier); t++){
    if (STATE.picks[t]) chosen.push({tier:t, name: STATE.picks[t]});
  }
  
  const maxRelics = Math.min(6, currentTier);

  const stats = [
    { label: "Current Tier", value: `${currentTier}` },
    { label: "Chosen relics", value: `${chosen.length}/${maxRelics}` },
    { label: "XP boost", value: `+${numeric.xpBoostTotal}%` },
    { label: "Drop rate", value: `+${numeric.dropRateTotal}%` }
  ];

  for (const s of stats){
    const el = document.createElement("div");
    el.className = "stat";
    el.innerHTML = `<div class="label">${s.label}</div><div class="value">${s.value}</div>`;
    host.appendChild(el);
  }
}

function renderDetail(){
  const t = STATE.activeTier;
  const meta = tierMeta(t);
  const pick = STATE.picks[t];
  const info = relicInfo(pick);

  const pillEl = DOM.activeTierPill || document.getElementById("activeTierPill");
  if (pillEl) pillEl.textContent = `Tier: ${t}`;

  const host = DOM.detail || document.getElementById("detail");
  const passives = (meta?.passives || []);
  const tierNote = (STATE.notes[t] || "").trim();

  const relicHtml = (() => {
    if (!pick) return `<div class="small" style="padding:40px; text-align:center; color:var(--muted)">No relic selected for Tier ${t}. Click an icon above to choose one.</div>`;
    if (!info){
      const img = getRelicImage(pick);
      return `
        <div class="relic-detail-header">
          ${img ? `<img src="${img}" alt="${escapeHtml(pick)}" class="relic-detail-icon">` : ""}
          <div class="relic-detail-info">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
              <div>
                <span class="pill accent">Selected</span>
                <span class="mono" style="font-weight:700; font-size:20px; margin-left:8px">${escapeHtml(pick)}</span>
              </div>
              <span class="pill warn">No details available</span>
            </div>
            <div class="small">This appears to be a placeholder or unrevealed relic.</div>
          </div>
        </div>
      `;
    }
    const tags = (info.tags || []).map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join(" ");
    const effects = (info.effects || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const img = getRelicImage(pick);
    return `
      <div class="relic-detail-header">
        ${img ? `<img src="${img}" alt="${escapeHtml(pick)}" class="relic-detail-icon">` : ""}
        <div class="relic-detail-info">
          <div style="margin-bottom:12px">
            <span class="pill accent">Selected</span>
            <span class="mono" style="font-weight:700; font-size:22px; margin-left:8px">${escapeHtml(pick)}</span>
          </div>
          <div style="margin-bottom:20px">${tags}</div>
        </div>
      </div>
      <div class="relic-effects-section">
        <div class="section-label">Relic Effects</div>
        <ul class="effects-list">${effects}</ul>
      </div>
    `;
  })();

  const passiveHtml = passives.length
    ? `<div class="passives-section">
        <ul class="passives-list">${passives.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>`
    : `<div class="small" style="padding:20px; text-align:center; color:var(--muted)">No passive info available.</div>`;

  const noteHtml = tierNote
    ? `<div style="margin-top:20px; padding-top:20px; border-top:1px solid var(--border)"><div class="small" style="margin-bottom:8px"><span class="pill accent">Your tier note</span></div><div style="white-space:pre-wrap; line-height:1.6">${escapeHtml(tierNote)}</div></div>`
    : "";

  host.innerHTML = `
    ${relicHtml}
    <div style="margin-top:24px; padding-top:24px; border-top:1px solid var(--border)">
      <div class="section-label">Tier ${t} Passives</div>
      ${passiveHtml}
    </div>
    ${noteHtml}
  `;
}

function renderCompare(){
  const t = STATE.activeTier;
  const host = DOM.compare || document.getElementById("compare");
  const opts = STATE.tierOptions[t] || [];
  if (!opts.length){
    host.innerHTML = "No tier options configured.";
    return;
  }

  const cards = opts.map(name=>{
    const info = relicInfo(name);
    const picked = (STATE.picks[t] === name);
    const tag = picked ? `<span class="pill good">Picked</span>` : ``;

    const img = getRelicImage(name);
    if(!info){
      return `
        <div class="compare-item ${picked ? "picked" : ""}">
          <div class="compare-item-header">
            ${img ? `<img src="${img}" alt="${escapeHtml(name)}" class="compare-icon">` : ""}
            <div class="compare-item-info">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                <div class="mono" style="font-weight:700; font-size:14px">${escapeHtml(name)}</div>
                ${tag || `<span class="pill warn">Unrevealed</span>`}
              </div>
              <div class="small">No details available (placeholder).</div>
            </div>
          </div>
        </div>
      `;
    }

    const effects = (info.effects || []).slice(0,3).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const more = (info.effects || []).length > 3 ? `<div class="small" style="margin-top:8px; color:var(--muted)">…and ${(info.effects || []).length-3} more effect${(info.effects || []).length-3 > 1 ? "s" : ""}</div>` : "";
    const tierLabel = info.tier === "reveal" ? `Revealed` : `Tier ${info.tier}`;
    const tags = (info.tags || []).map(x=>`<span class="pill" style="font-size:10px">${escapeHtml(x)}</span>`).join(" ");
    return `
      <div class="compare-item ${picked ? "picked" : ""}">
        <div class="compare-item-header">
          ${img ? `<img src="${img}" alt="${escapeHtml(name)}" class="compare-icon">` : ""}
          <div class="compare-item-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px">
              <div style="flex:1">
                <div class="mono" style="font-weight:700; font-size:15px; margin-bottom:6px">${escapeHtml(name)}</div>
                <div style="margin-bottom:6px">${tags}</div>
                <span class="pill" style="font-size:10px">${escapeHtml(tierLabel)}</span>
              </div>
              ${tag}
            </div>
            <ul class="list" style="margin-top:10px; margin-bottom:12px">${effects}</ul>
            ${more}
            ${!picked ? `<button class="btn primary" style="width:100%; margin-top:8px" onclick="pickForActiveTier(${t}, '${escapeJs(name)}')">Select This</button>` : `<div class="btn good" style="width:100%; margin-top:8px; text-align:center; cursor:default">Selected</div>`}
          </div>
        </div>
      </div>
    `;
  }).join("");

  host.innerHTML = cards;
}

function pickForActiveTier(t, name){
  STATE.picks[t] = name;
  dirty(); saveState();
  renderKPIs();
  renderDetail();
  renderCompare();
  renderTiers();
  toast(`Picked "${name}" for Tier ${t}`);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function escapeJs(s){
  // safe for single-quoted attribute
  return String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
}

function bindTopControls(){
  document.getElementById("btnReset").addEventListener("click", ()=>{
    if (!confirm("Reset your saved plan?")) return;
    STATE = defaultState();
    saveState();
    init();
    toast("Plan reset.");
  });

  document.getElementById("btnExport").addEventListener("click", async ()=>{
    const data = JSON.stringify(STATE, null, 2);
    try{
      await navigator.clipboard.writeText(data);
      toast("Export copied to clipboard.");
    }catch(e){
      prompt("Copy your export JSON:", data);
    }
  });

  document.getElementById("btnImport").addEventListener("click", ()=>{
    const raw = prompt("Paste exported JSON here:");
    if (!raw) return;
    try{
      const parsed = JSON.parse(raw);
      // minimal validation
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
      STATE = { ...defaultState(), ...parsed };
      saveState();
      init();
      toast("Imported successfully.");
    }catch(e){
      alert("Import failed: invalid JSON.");
    }
  });

  const planName = DOM.planName || document.getElementById("planName");
  if (planName) {
    planName.value = STATE.planName || "";
    planName.addEventListener("input", ()=>{
      STATE.planName = planName.value;
      dirty(); saveState();
    });
  }

  // Current tier selector
  const currentTierSelect = DOM.currentTier || document.getElementById("currentTier");
  if (currentTierSelect) {
    currentTierSelect.value = STATE.currentTier || 8;
    currentTierSelect.addEventListener("change", () => {
      STATE.currentTier = Number(currentTierSelect.value);
      dirty(); saveState();
      renderBonusSummary();
      renderKPIs();
    });
  }
}

function renderBonusSummary(){
  const host = DOM.bonusSummary || document.getElementById("bonusSummary");
  if (!host) return;
  
  const currentTier = STATE.currentTier || 8;
  
  // Track bonuses from tier passives vs relics
  const tierBonuses = {
    paragonPoints: 0,
    dropRate: 0,
    xpBoost: 0,
    defencePenetration: 0,
    minimumHit: 0,
    petChance: 1,
    gatherChance: 0,
    slayerPicks: 0,
    runeAmmoSave: 0,
    npcAggression: 1,
    autoGathers: 1
  };
  
  const relicBonuses = {
    minimumHit: 0,
    dropRate: 0,
    xpBoost: 0,
    slayerPoints: 0,
    damageBoost: 1, // multiplicative
    healPercent: 0
  };
  
  const specialBonuses = [];
  const relicSpecialBonuses = [];
  
  // Calculate tier passive bonuses (only up to currentTier)
  for (const meta of TIERS) {
    if (meta.tier > currentTier) continue;
    
    for (const p of (meta.passives || [])) {
      // Paragon Points
      if (/Gain 5 Paragon Points/i.test(p)) {
        tierBonuses.paragonPoints += 5;
      } else if (/Gain 150 Paragon Points/i.test(p)) {
        tierBonuses.paragonPoints += 150;
      }
      
      // Drop rate - calculate based on current tier
      const dropTotal = p.match(/drop rate.*\(Total of \+(\d+)%\)/i);
      const dropAdd = p.match(/^\+(\d+)% drop rate/i);
      if (dropTotal) {
        tierBonuses.dropRate = Math.max(tierBonuses.dropRate, Number(dropTotal[1]));
      } else if (dropAdd && !/Total of/i.test(p)) {
        const val = Number(dropAdd[1]);
        tierBonuses.dropRate += val;
      }
      
      // XP boost - use "Total of" if present
      const xpTotal = p.match(/XP boost\s*\(Total of \+(\d+)%\)/i);
      const xpAdd = p.match(/^\+(\d+)% XP boost$/i);
      if (xpTotal) {
        tierBonuses.xpBoost = Math.max(tierBonuses.xpBoost, Number(xpTotal[1]));
      } else if (xpAdd) {
        tierBonuses.xpBoost += Number(xpAdd[1]);
      }
      
      // Defence penetration
      const defPen = p.match(/\+(\d+)% more defence penetration/i);
      if (defPen) tierBonuses.defencePenetration += Number(defPen[1]);
      
      // Minimum hit
      const minHit = p.match(/\+(\d+) minimum hit/i);
      if (minHit) tierBonuses.minimumHit += Number(minHit[1]);
      
      // Pet chance (multiplicative)
      if (/2x chance to receive Pets/i.test(p)) {
        tierBonuses.petChance *= 2;
      }
      
      // Gather chance
      const gatherChance = p.match(/\+(\d+)% chance to successfully gather/i);
      if (gatherChance) tierBonuses.gatherChance += Number(gatherChance[1]);
      
      // Slayer task picks
      const slayerPicks = p.match(/\+(\d+) slayer task picks/i);
      if (slayerPicks) tierBonuses.slayerPicks += Number(slayerPicks[1]);
      
      // Rune/ammo save
      const runeAmmo = p.match(/Save (\d+)% of runes\/ammo\/charges/i);
      if (runeAmmo) tierBonuses.runeAmmoSave = Number(runeAmmo[1]);
      
      // NPC aggression (multiplicative)
      if (/NPC aggression lasts 5x longer/i.test(p)) {
        tierBonuses.npcAggression *= 5;
      }
      
      // Auto gathers (multiplicative)
      if (/2x the amount of automatic gathers/i.test(p)) {
        tierBonuses.autoGathers *= 2;
      }
      
      // Special bonuses (non-numeric)
      if (/Auto bank all herbs and currency/i.test(p)) {
        specialBonuses.push("Auto bank herbs & currency");
      }
      if (/Auto bank all keys, slayer parts/i.test(p)) {
        specialBonuses.push("Auto bank keys, slayer parts & boxes");
      }
      if (/Unlock bonfires/i.test(p)) {
        specialBonuses.push("Bonfires unlocked");
      }
      if (/Spirit of Seren/i.test(p)) {
        specialBonuses.push("1% Spirit of Seren spawn when gathering");
      }
      if (/60% chance to save 10% of resources/i.test(p)) {
        specialBonuses.push("60% chance to save 10% crafting resources");
      }
      if (/Banker's note/i.test(p)) {
        specialBonuses.push("Banker's note access");
      }
      if (/Gather noted resources/i.test(p)) {
        specialBonuses.push("Gather noted resources");
      }
      if (/Craft 3 extra runes/i.test(p)) {
        specialBonuses.push("+3 runes per essence");
      }
      if (/Toxic orbs are not consumed/i.test(p)) {
        specialBonuses.push("Toxic orbs not consumed");
      }
      if (/Ignis teleport scrolls are not consumed/i.test(p)) {
        specialBonuses.push("Ignis teleports not consumed");
      }
      if (/ToA Warden without your key/i.test(p)) {
        specialBonuses.push("ToA Warden key not consumed");
      }
      if (/1-off singular perk reset/i.test(p)) {
        specialBonuses.push("1x perk reset available");
      }
    }
  }
  
  // Parse selected relic effects for bonuses (only up to currentTier)
  const relicsToCheck = [];
  for (let t = 1; t <= Math.min(6, currentTier); t++) {
    const pick = STATE.picks[t];
    if (pick && RELICS[pick]) {
      relicsToCheck.push({ tier: t, name: pick, info: RELICS[pick] });
    }
  }
  
  // Add Reloaded bonus if applicable
  if (currentTier >= 5 && STATE.picks[5] === "Reloaded" && STATE.reloadedPick && RELICS[STATE.reloadedPick]) {
    relicsToCheck.push({ tier: "5R", name: STATE.reloadedPick, info: RELICS[STATE.reloadedPick], isReloaded: true });
  }
  
  for (const { name, info } of relicsToCheck) {
    for (const effect of (info.effects || [])) {
      // Minimum hit from relics
      const minHit = effect.match(/\+(\d+) minimum hit/i);
      if (minHit) relicBonuses.minimumHit += Number(minHit[1]);
      
      // Drop rate from relics (e.g., Luck of the Dwarves)
      const dropRate = effect.match(/(\d+)% increased drop rate/i);
      if (dropRate) relicBonuses.dropRate += Number(dropRate[1]);
      
      // Damage boost (multiplicative)
      const dmgBoost = effect.match(/Deal (\d+)% more damage/i);
      if (dmgBoost) relicBonuses.damageBoost *= (1 + Number(dmgBoost[1]) / 100);
      
      // XP from relics (e.g., Prestigious double XP)
      if (/Gain double XP/i.test(effect)) {
        relicBonuses.xpBoost += 100; // Double = +100%
      }
      
      // Slayer points
      const slayerPts = effect.match(/Gain (\d+)% more Slayer points/i);
      if (slayerPts) relicBonuses.slayerPoints += Number(slayerPts[1]);
      
      // Heal percent (Vampyrism)
      const healPct = effect.match(/Heal for (\d+)% of damage dealt/i);
      if (healPct) relicBonuses.healPercent += Number(healPct[1]);
      
      // Special relic bonuses
      if (/2x faster/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Attack speed 2x`);
      }
      if (/Infinitely repeat gathering/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Infinite gathering`);
      }
      if (/immediately crafting all queued/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Instant crafting`);
      }
      if (/infinitely pick your Slayer tasks/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Infinite slayer picks`);
      }
      if (/Summon.*Bloodworm.*Guardian/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Combat pets`);
      }
      if (/Passively regenerate/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: HP/Prayer regen`);
      }
      if (/flurry of attacks/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Attack flurry proc`);
      }
      if (/clues.*10x the regular rate/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: 10x clue rate`);
      }
      if (/roll twice on any loot/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Double loot rolls`);
      }
      if (/treasure goblin/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Treasure goblins`);
      }
      if (/Holy hammers spin/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Holy hammers`);
      }
      if (/automatically harvested and replanted/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Auto farming`);
      }
      if (/All loot is automatically banked/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Auto loot banking`);
      }
      if (/Ignore all damage reduction/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Bypass damage reduction`);
      }
      if (/Sage's axe/i.test(effect)) {
        relicSpecialBonuses.push(`${name}: Sage's axe (1000 dmg execute)`);
      }
    }
  }
  
  // Calculate combined totals
  const totalMinHit = tierBonuses.minimumHit + relicBonuses.minimumHit;
  const totalDropRate = tierBonuses.dropRate + relicBonuses.dropRate;
  const totalXpBoost = tierBonuses.xpBoost + relicBonuses.xpBoost;
  
  // Gather selected relic effects
  const selectedRelics = [];
  for (let t = 1; t <= 6; t++) {
    const pick = STATE.picks[t];
    if (pick && RELICS[pick]) {
      const info = RELICS[pick];
      const img = getRelicImage(pick);
      selectedRelics.push({
        tier: t,
        name: pick,
        effects: info.effects || [],
        tags: info.tags || [],
        img
      });
    }
  }
  
  // Add Reloaded bonus pick if selected
  if (STATE.picks[5] === "Reloaded" && STATE.reloadedPick && RELICS[STATE.reloadedPick]) {
    const info = RELICS[STATE.reloadedPick];
    const img = getRelicImage(STATE.reloadedPick);
    selectedRelics.push({
      tier: "5 (Reloaded)",
      name: STATE.reloadedPick,
      effects: info.effects || [],
      tags: info.tags || [],
      img,
      isReloaded: true
    });
  }
  
  const relicsHtml = selectedRelics.map(r => `
    <div class="selected-relic-card ${r.isReloaded ? 'reloaded-bonus' : ''}">
      <div class="selected-relic-header">
        ${r.img ? `<img src="${r.img}" alt="${escapeHtml(r.name)}" class="selected-relic-icon">` : ''}
        <div class="selected-relic-info">
          <div class="selected-relic-name">${escapeHtml(r.name)}</div>
          <div class="selected-relic-tier">Tier ${r.tier}${r.isReloaded ? ' <span class="pill accent" style="font-size:9px">Bonus</span>' : ''}</div>
        </div>
      </div>
      <ul class="selected-relic-effects">
        ${r.effects.map(e => `<li>${escapeHtml(e)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
  
  // Helper to show relic contribution
  const showRelicBonus = (relicVal, unit = "") => {
    if (relicVal > 0) {
      return `<span class="relic-bonus" title="From relics">+${relicVal}${unit}</span>`;
    }
    return "";
  };
  
  host.innerHTML = `
    <div class="tier-indicator">
      Showing bonuses for: <strong>Tier 1 – ${currentTier}</strong>
    </div>
    
    <div class="summary-grid">
      <div class="summary-group">
        <h4>Combat & Stats</h4>
        <div class="summary-item">
          <span class="summary-label">Paragon Points</span>
          <span class="summary-value">${tierBonuses.paragonPoints}</span>
        </div>
        <div class="summary-item ${relicBonuses.dropRate > 0 ? 'has-relic-bonus' : ''}">
          <span class="summary-label">Drop Rate Bonus</span>
          <span class="summary-value accent">+${totalDropRate}%${showRelicBonus(relicBonuses.dropRate, "%")}</span>
        </div>
        <div class="summary-item ${relicBonuses.xpBoost > 0 ? 'has-relic-bonus' : ''}">
          <span class="summary-label">XP Boost</span>
          <span class="summary-value accent">+${totalXpBoost}%${showRelicBonus(relicBonuses.xpBoost, "%")}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Defence Penetration</span>
          <span class="summary-value">+${tierBonuses.defencePenetration}%</span>
        </div>
        <div class="summary-item ${relicBonuses.minimumHit > 0 ? 'has-relic-bonus' : ''}">
          <span class="summary-label">Minimum Hit</span>
          <span class="summary-value">+${totalMinHit}${showRelicBonus(relicBonuses.minimumHit)}</span>
        </div>
        ${relicBonuses.damageBoost > 1 ? `
        <div class="summary-item has-relic-bonus">
          <span class="summary-label">Damage Multiplier</span>
          <span class="summary-value relic-highlight">${(relicBonuses.damageBoost * 100).toFixed(0)}%</span>
        </div>` : ''}
        ${relicBonuses.healPercent > 0 ? `
        <div class="summary-item has-relic-bonus">
          <span class="summary-label">Lifesteal</span>
          <span class="summary-value relic-highlight">${relicBonuses.healPercent}%</span>
        </div>` : ''}
      </div>
      
      <div class="summary-group">
        <h4>Skilling & Gathering</h4>
        <div class="summary-item">
          <span class="summary-label">Pet Chance</span>
          <span class="summary-value">${tierBonuses.petChance}x</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Gather Success</span>
          <span class="summary-value">+${tierBonuses.gatherChance}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Auto Gathers</span>
          <span class="summary-value">${tierBonuses.autoGathers}x</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Rune/Ammo Save</span>
          <span class="summary-value">${tierBonuses.runeAmmoSave}%</span>
        </div>
        <div class="summary-item ${relicBonuses.slayerPoints > 0 ? 'has-relic-bonus' : ''}">
          <span class="summary-label">Slayer Task Picks</span>
          <span class="summary-value">+${tierBonuses.slayerPicks}/day</span>
        </div>
        ${relicBonuses.slayerPoints > 0 ? `
        <div class="summary-item has-relic-bonus">
          <span class="summary-label">Slayer Points Bonus</span>
          <span class="summary-value relic-highlight">+${relicBonuses.slayerPoints}%</span>
        </div>` : ''}
        <div class="summary-item">
          <span class="summary-label">NPC Aggression</span>
          <span class="summary-value">${tierBonuses.npcAggression}x duration</span>
        </div>
      </div>
      
      <div class="summary-group special">
        <h4>Tier Unlocks</h4>
        <ul class="special-list">
          ${specialBonuses.length > 0 ? specialBonuses.map(b => `<li>${escapeHtml(b)}</li>`).join("") : '<li class="none">None at current tier</li>'}
        </ul>
      </div>
      
      ${relicSpecialBonuses.length > 0 ? `
      <div class="summary-group relic-special">
        <h4>Relic Abilities</h4>
        <ul class="special-list relic-list">
          ${relicSpecialBonuses.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
      </div>` : ''}
    </div>
    
    <div class="selected-relics-section">
      <h3>Your Selected Relic Benefits</h3>
      <div class="selected-relics-grid">
        ${relicsHtml || '<div class="no-relics">No relics selected yet.</div>'}
      </div>
    </div>
    
    <div class="summary-note">
      <strong>Note:</strong> Drop rate bonuses and damage % multipliers from relics are multiplicative, not additive.
    </div>
  `;
}

function cacheDOM(){
  // Cache frequently accessed elements
  DOM.tiers = document.getElementById("tiers");
  DOM.kpis = document.getElementById("kpis");
  DOM.detail = document.getElementById("detail");
  DOM.compare = document.getElementById("compare");
  DOM.bonusSummary = document.getElementById("bonusSummary");
  DOM.saveState = document.getElementById("saveState");
  DOM.activeTierPill = document.getElementById("activeTierPill");
  DOM.toast = document.getElementById("toast");
  DOM.planName = document.getElementById("planName");
  DOM.currentTier = document.getElementById("currentTier");
}

function init(){
  cacheDOM();
  bindTopControls();
  renderTiers();
  renderKPIs();
  renderDetail();
  renderCompare();
  renderBonusSummary();
}

init();
