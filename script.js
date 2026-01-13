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

// Populate map select dropdown
const mapSelect = document.getElementById("mapSelect");
MAPS.forEach((map) => {
  const opt = document.createElement("option");
  opt.value = map;
  opt.textContent = map
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

// Attach click listener
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
  const selectedMap = document.getElementById("mapSelect").value;

  // Validation
  for (const hero of heroInput) {
    if (!VALID_HEROES.has(hero)) {
      output.innerHTML = `<div class="error">Invalid hero key: ${hero}</div>`;
      return;
    }
  }

  output.innerHTML = ""; // clear previous output

  for (const hero of heroInput) {
    for (const region of regions) {
      const section = document.createElement("div");
      section.className = "region";
      section.innerHTML = `<h3>${hero.toUpperCase()} — ${region.toUpperCase()}</h3>`;
      const pre = document.createElement("pre");
      section.appendChild(pre);
      output.appendChild(section);

      if (gamemode === "quickplay") {
        // Quick Play: no ranks
        await new Promise((r) => setTimeout(r, 400)); // rate-limit
        const params = new URLSearchParams({
          platform: "pc",
          gamemode,
          region,
        });
        if (selectedMap) params.append("map", selectedMap);

        try {
          const res = await fetch(`${BASE_URL}/heroes/stats?${params}`);
          if (!res.ok) {
            pre.textContent = `Winrate: API error\nPickrate: API error\n`;
          } else {
            const data = await res.json();
            const heroData = data.find((h) => h.hero === hero);
            if (heroData) {
              const win = `${heroData.winrate.toFixed(2)}%`.padEnd(12);
              const pick = `${heroData.pickrate.toFixed(2)}%`.padEnd(12);
              pre.textContent = `Winrate: ${win} Pickrate: ${pick}\n`;
            } else {
              pre.textContent = `No data\n`;
            }
          }
        } catch (err) {
          pre.textContent = `API error\n`;
        }
      } else {
        // Competitive: show all ranks
        pre.textContent = "Fetching ranks...\n";
        for (const rank of RANKS) {
          await new Promise((r) => setTimeout(r, 400));
          const params = new URLSearchParams({
            platform: "pc",
            gamemode,
            region,
            competitive_division: rank,
          });
          if (selectedMap) params.append("map", selectedMap);

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
              pre.textContent += `${rank.padEnd(
                12
              )} Winrate: ${win} Pickrate: ${pick}\n`;
            } else {
              pre.textContent += `${rank.padEnd(12)} No data\n`;
            }
          } catch (err) {
            pre.textContent += `${rank.padEnd(12)} API error\n`;
          }
        }
        pre.textContent = pre.textContent.replace("Fetching ranks...\n", ""); // remove placeholder
      }
    }
  }
}
