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

// Maps broken in API
const BROKEN_MAPS = new Set(["anubis", "hanaoka"]);

const MAPS = [
  "aatlis",
  "anubis",
  "blizzard-world",
  "busan",
  "circuit-royal",
  "colosseo",
  "dorado",
  "eichenwalde",
  "esperanca",
  "hanaoka",
  "havana",
  "hollywood",
  "horizon",
  "ilios",
  "junkertown",
  "lijiang-tower",
  "kings-row",
  "midtown",
  "necropolis",
  "nepal",
  "new-junk-city",
  "new-queen-street",
  "numbani",
  "oasis",
  "paraiso",
  "rialto",
  "route-66",
  "runasapi",
  "samoa",
  "shambali-monastery",
  "suravasa",
];

let VALID_HEROES = new Set();

// Populate map dropdown
const mapSelect = document.getElementById("mapSelect");
MAPS.forEach((map) => {
  const opt = document.createElement("option");
  opt.value = map;
  opt.textContent = map
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (BROKEN_MAPS.has(map)) {
    opt.textContent += " ⚠";
    opt.disabled = true;
  }
  mapSelect.appendChild(opt);
});

// Load valid heroes
async function loadHeroes() {
  try {
    const res = await fetch(`${BASE_URL}/heroes`);
    const data = await res.json();
    data.forEach((h) => VALID_HEROES.add(h.key));
  } catch (err) {
    console.error("Failed to load heroes:", err);
  }
}
loadHeroes();

// Apply theme to dynamic elements
function refreshDynamicTheme() {
  document.querySelectorAll(".region").forEach((el) => {
    el.style.backgroundColor = "var(--panel)";
    el.style.color = "var(--text)";
  });
  document.querySelectorAll("pre").forEach((el) => {
    el.style.backgroundColor = "var(--pre-bg)";
    el.style.color = "var(--pre-text)"; // green text
  });
}

// Fetch button
document.getElementById("fetchBtn").addEventListener("click", run);

async function run() {
  const output = document.getElementById("output");
  output.innerHTML = "<strong>Fetching...</strong>";

  const heroInput = document
    .getElementById("heroes")
    .value.toLowerCase()
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  const allRegions = document.getElementById("allRegions").checked;
  const regions = allRegions ? ["americas", "europe", "asia"] : ["americas"];
  const gamemode = document.getElementById("gamemode").value;
  const selectedMap = mapSelect.value;

  for (const hero of heroInput) {
    if (!VALID_HEROES.has(hero)) {
      output.innerHTML = `<div class="error">Invalid hero key: ${hero}</div>`;
      return;
    }
  }

  output.innerHTML = "";

  for (const hero of heroInput) {
    for (const region of regions) {
      const section = document.createElement("div");
      section.className = "region";
      section.innerHTML = `<h3>${hero.toUpperCase()} — ${region.toUpperCase()}</h3>`;
      const pre = document.createElement("pre");
      section.appendChild(pre);
      output.appendChild(section);

      refreshDynamicTheme();

      if (selectedMap && BROKEN_MAPS.has(selectedMap)) {
        pre.textContent = "No data available for this map";
        continue;
      }

      if (gamemode === "quickplay") {
        await new Promise((r) => setTimeout(r, 400));
        const params = new URLSearchParams({
          platform: "pc",
          gamemode,
          region,
        });
        if (selectedMap) params.append("map", selectedMap);

        try {
          const res = await fetch(`${BASE_URL}/heroes/stats?${params}`);
          if (!res.ok) {
            pre.textContent =
              res.status === 404
                ? "No stats available for this map"
                : `API error: ${res.status}`;
            continue;
          }
          const data = await res.json();
          const heroData = data.find((h) => h.hero === hero);
          if (heroData) {
            const win = `${heroData.winrate.toFixed(2)}%`.padEnd(12);
            const pick = `${heroData.pickrate.toFixed(2)}%`.padEnd(12);
            pre.textContent = `Winrate: ${win} Pickrate: ${pick}\n`;
          } else {
            pre.textContent = "No stats available";
          }
        } catch {
          pre.textContent = "API error (network issue)";
        }
      } else {
        // Competitive mode
        pre.textContent = "";
        for (const rank of RANKS) {
          await new Promise((r) => setTimeout(r, 400));
          const params = new URLSearchParams({
            platform: "pc",
            gamemode,
            region,
            competitive_division: rank,
          });

          try {
            const res = await fetch(`${BASE_URL}/heroes/stats?${params}`);
            if (!res.ok) {
              pre.textContent += `${rank.padEnd(12)} API error\n`;
              continue;
            }
            const data = await res.json();
            const heroData = data.find((h) => h.hero === hero);
            if (heroData) {
              const win = `${heroData.winrate.toFixed(2)}%`.padEnd(12);
              const pick = `${heroData.pickrate.toFixed(2)}%`.padEnd(12);
              pre.textContent += `${rank.padEnd(12)} Winrate: ${win} Pickrate: ${pick}\n`;
            } else {
              pre.textContent += `${rank.padEnd(12)} No data\n`;
            }
          } catch {
            pre.textContent += `${rank.padEnd(12)} Network error\n`;
          }
        }
      }
    }
  }
}

// Theme toggle
const toggle = document.getElementById("themeToggle");
const label = document.getElementById("themeLabel");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  toggle.checked = true;
  label.textContent = "Dark";
}

toggle.addEventListener("change", () => {
  const dark = toggle.checked;
  document.body.classList.toggle("dark", dark);
  label.textContent = dark ? "Dark" : "Light";
  localStorage.setItem("theme", dark ? "dark" : "light");
  refreshDynamicTheme();
});
