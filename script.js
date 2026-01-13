const BASE_URL = "https://overfast-api.tekrop.fr";

const RANKS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "master",
  "grandmaster",
];

let VALID_HEROES = new Set();

// Load valid heroes once
async function loadHeroes() {
  const res = await fetch(`${BASE_URL}/heroes`);
  const data = await res.json();
  data.forEach((h) => VALID_HEROES.add(h.key));
}

loadHeroes();

async function run() {
  const output = document.getElementById("output");
  output.innerHTML = "";

  const heroInput = document
    .getElementById("heroes")
    .value.toLowerCase()
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  const allRegions = document.getElementById("allRegions").checked;
  const regions = allRegions ? ["americas", "europe", "asia"] : ["americas"];

  // ---------- VALIDATION ----------
  for (const hero of heroInput) {
    if (!VALID_HEROES.has(hero)) {
      output.innerHTML = `<div class="error">Invalid hero key: ${hero}</div>`;
      return; // HARD FAIL
    }
  }

  // ---------- FETCH ----------
  for (const hero of heroInput) {
    for (const region of regions) {
      const section = document.createElement("div");
      section.className = "region";
      section.innerHTML = `<h3>${hero.toUpperCase()} — ${region.toUpperCase()}</h3>`;
      const pre = document.createElement("pre");

      for (const rank of RANKS) {
        const params = new URLSearchParams({
          platform: "pc",
          gamemode: "competitive",
          region,
          competitive_division: rank,
        });

        const res = await fetch(`${BASE_URL}/heroes/stats?${params}`);
        if (!res.ok) {
          pre.textContent += `${rank}: API error\n`;
          continue;
        }

        const data = await res.json();
        const heroData = data.find((h) => h.hero === hero);

        if (heroData) {
          pre.textContent +=
            `${rank.padEnd(12)} ` +
            `Winrate: ${heroData.winrate.toFixed(2)}% ` +
            `Pickrate: ${heroData.pickrate.toFixed(2)}%\n`;
        } else {
          pre.textContent += `${rank}: No data\n`;
        }
      }

      section.appendChild(pre);
      output.appendChild(section);
    }
  }
}
