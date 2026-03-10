const STORAGE_KEY = "gymTracker_v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function seedExercises() {
  // À partir de tes notes (tu pourras ajouter/modifier dans l’appli en tapant un nouvel exo)
  return [
    // Jambes
    { name:"Squat à la barre", group:"Jambes", unit:"kg total", baseline:50, note:"" },
    { name:"Presse", group:"Jambes", unit:"kg total", baseline:80, note:"" },
    { name:"Leg extension", group:"Jambes", unit:"kg total", baseline:50, note:"+ disques (3kg / 1.5kg ?) selon machine" },
    { name:"Leg curl", group:"Jambes", unit:"kg total", baseline:30, note:"tu notes 30–35kg" },
    { name:"Adducteur", group:"Jambes", unit:"kg total", baseline:50, note:"bonne machine" },
    { name:"Abducteur", group:"Jambes", unit:"kg total", baseline:90, note:"fausse machine" },

    // Push
    { name:"Développé incliné haltère", group:"Push", unit:"kg par haltère", baseline:20, note:"" },
    { name:"DC", group:"Push", unit:"kg total", baseline:55, note:"" },
    { name:"Poulie double", group:"Push", unit:"kg total", baseline:20, note:"possible 25kg 1ère série" },
    { name:"Élévation frontale", group:"Push", unit:"kg par haltère", baseline:7.5, note:"" },
    { name:"Barre au front haltère", group:"Push", unit:"kg par haltère", baseline:12.5, note:"" },
    { name:"Triceps poulie mini barre", group:"Push", unit:"kg total", baseline:70, note:"" },
    { name:"Élévation latérale haltère", group:"Push", unit:"kg par haltère", baseline:8, note:"" },
    { name:"Développé militaire", group:"Push", unit:"kg par côté", baseline:17.5, note:"par côté" },

    // Pull
    { name:"Traction", group:"Pull", unit:"reps (poids du corps)", baseline:null, note:"record: 2x5 + 1x3" },
    { name:"Tirage vertical machine", group:"Pull", unit:"kg total", baseline:50, note:"" },
    { name:"Tirage horizontale poulie", group:"Pull", unit:"kg total", baseline:40, note:"45kg: 2x10 + 1x8" },
    { name:"Tirage horizontal rowing", group:"Pull", unit:"kg par côté", baseline:20, note:"par côté" },
    { name:"Poulie de dieu", group:"Pull", unit:"kg total", baseline:70, note:"poulie simple" },
    { name:"Rowing poulie", group:"Pull", unit:"kg total", baseline:20, note:"" },
    { name:"Rowing machine", group:"Pull", unit:"kg par côté", baseline:25, note:"30kg ok" },
    { name:"Biceps haltère", group:"Pull", unit:"kg par haltère", baseline:10, note:"" },
    { name:"Marteau", group:"Pull", unit:"kg par haltère", baseline:10, note:"" },
    { name:"Arrière épaule poulie", group:"Pull", unit:"kg total", baseline:30, note:"" },

    // Bras
    { name:"Dips", group:"Bras", unit:"reps (poids du corps)", baseline:null, note:"1ère série ~14–15 reps" },
    { name:"DC serré", group:"Bras", unit:"kg par côté", baseline:15, note:"15kg de chaque côté (barre non comptée)" },
    { name:"Triceps haltère derrière la tête", group:"Bras", unit:"kg par haltère", baseline:10, note:"" },
    { name:"Brachial + avant-bras (petite barre)", group:"Bras", unit:"kg par côté", baseline:5, note:"par côté" },
    { name:"Triceps poulie simple", group:"Bras", unit:"kg total", baseline:80, note:"" },
    { name:"Biceps poulie simple", group:"Bras", unit:"kg total", baseline:null, note:"poids à compléter" },
  ];
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = { exercises: seedExercises(), entries: [], bodyweights: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  try {
    const data = JSON.parse(raw);
    data.exercises ||= seedExercises();
    data.entries ||= [];
    data.bodyweights ||= [];
    return data;
  } catch {
    const data = { exercises: seedExercises(), entries: [], bodyweights: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = loadData();

// ---------- UI helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function setTab(id) {
  $$(".panel").forEach(p => p.classList.remove("show"));
  $$(".tab").forEach(b => b.classList.remove("active"));
  $("#" + id).classList.add("show");
  document.querySelector(`.tab[data-tab="${id}"]`).classList.add("active");
}

// ---------- Tabs
$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

// ---------- Populate lists
function refreshExerciseDatalist() {
  const dl = $("#exerciseList");
  dl.innerHTML = "";
  state.exercises
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name))
    .forEach(ex => {
      const opt = document.createElement("option");
      opt.value = ex.name;
      dl.appendChild(opt);
    });
}

function refreshFilterExerciseSelect() {
  const sel = $("#filterExercise");
  const current = sel.value;
  const names = Array.from(new Set(state.entries.map(e => e.exercise))).sort((a,b)=>a.localeCompare(b));

  sel.innerHTML = `<option value="">Tous</option>` + names.map(n=>`<option>${n}</option>`).join("");
  if (names.includes(current)) sel.value = current;
}

function refreshStatsExerciseSelect() {
  const sel = $("#statsExercise");
  const current = sel.value;
  const names = Array.from(new Set([
    ...state.entries.map(e=>e.exercise),
    ...state.exercises.map(e=>e.name)
  ])).sort((a,b)=>a.localeCompare(b));

  sel.innerHTML = names.map(n=>`<option>${n}</option>`).join("");
  if (names.includes(current)) sel.value = current;
}

// ---------- Entry form behavior
function findExerciseByName(name) {
  return state.exercises.find(e => e.name.toLowerCase() === name.trim().toLowerCase());
}

function updateExerciseHint() {
  const exName = $("#exercise").value.trim();
  const ex = findExerciseByName(exName);
  const hint = $("#exerciseHint");
  if (!ex) { hint.textContent = "Astuce: si tu tapes un nouvel exercice, il sera ajouté automatiquement."; return; }

  // auto session & unit
  $("#sessionType").value = ex.group || $("#sessionType").value;
  $("#unit").value = ex.unit || $("#unit").value;

  const baseTxt = (ex.baseline != null) ? `Repère: ${ex.baseline} (${ex.unit})` : `Repère: —`;
  const noteTxt = ex.note ? ` • ${ex.note}` : "";
  hint.textContent = baseTxt + noteTxt;
}

$("#exercise").addEventListener("input", updateExerciseHint);

$("#clearForm").addEventListener("click", () => {
  $("#exercise").value = "";
  $("#weight").value = "";
  $("#reps").value = "";
  $("#sets").value = "3";
  $("#note").value = "";
  $("#exerciseHint").textContent = "";
});

// ---------- Add entry
$("#entryForm").addEventListener("submit", (ev) => {
  ev.preventDefault();

  const date = $("#date").value;
  const sessionType = $("#sessionType").value;
  const exercise = $("#exercise").value.trim();
  const unit = $("#unit").value;
  const weight = $("#weight").value === "" ? null : Number($("#weight").value);
  const reps = $("#reps").value === "" ? null : Number($("#reps").value);
  const sets = $("#sets").value === "" ? null : Number($("#sets").value);
  const note = $("#note").value.trim();

  if (!date || !exercise) return;

  // add to exercises list if new
  if (!findExerciseByName(exercise)) {
    state.exercises.push({ name: exercise, group: sessionType, unit, baseline: null, note: "" });
    refreshExerciseDatalist();
  }

  state.entries.push({ id: uid(), date, sessionType, exercise, unit, weight, reps, sets, note });
  saveData();

  refreshAll();
  // keep exercise for fast logging, clear others
  $("#weight").value = "";
  $("#reps").value = "";
  $("#note").value = "";
});

// ---------- Delete entry
function deleteEntry(id) {
  state.entries = state.entries.filter(e => e.id !== id);
  saveData();
  refreshAll();
}

// ---------- Tables
function formatWeight(e) {
  if (e.weight == null) return "";
  return `${e.weight} kg`;
}
function escapeHtml(s) {
  return (s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderRecent() {
  const tbody = $("#recentTable tbody");
  tbody.innerHTML = "";
  state.entries
    .slice()
    .sort((a,b)=>b.date.localeCompare(a.date))
    .slice(0, 8)
    .forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.date}</td>
        <td>${escapeHtml(e.sessionType)}</td>
        <td>${escapeHtml(e.exercise)}</td>
        <td>${escapeHtml(formatWeight(e))}</td>
        <td>${e.reps ?? ""}</td>
        <td>${e.sets ?? ""}</td>
        <td class="note">${escapeHtml(e.note)}</td>
        <td><button class="ghost" data-del="${e.id}">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.del));
  });
}

function getFilteredEntries() {
  const ex = $("#filterExercise").value;
  const sess = $("#filterSession").value;
  const txt = $("#filterText").value.trim().toLowerCase();

  return state.entries.filter(e => {
    if (ex && e.exercise !== ex) return false;
    if (sess && e.sessionType !== sess) return false;
    if (txt && !(e.note || "").toLowerCase().includes(txt) && !e.exercise.toLowerCase().includes(txt)) return false;
    return true;
  }).slice().sort((a,b)=>b.date.localeCompare(a.date));
}

function renderHistory() {
  const tbody = $("#historyTable tbody");
  tbody.innerHTML = "";
  getFilteredEntries().forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${escapeHtml(e.sessionType)}</td>
      <td>${escapeHtml(e.exercise)}</td>
      <td>${escapeHtml(e.unit)}</td>
      <td>${escapeHtml(formatWeight(e))}</td>
      <td>${e.reps ?? ""}</td>
      <td>${e.sets ?? ""}</td>
      <td class="note">${escapeHtml(e.note)}</td>
      <td><button class="ghost" data-del="${e.id}">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.del));
  });
}

$("#clearFilters").addEventListener("click", () => {
  $("#filterExercise").value = "";
  $("#filterSession").value = "";
  $("#filterText").value = "";
  renderHistory();
});

["#filterExercise", "#filterSession", "#filterText"].forEach(sel => {
  $(sel).addEventListener("input", renderHistory);
});

// ---------- Stats chart
let chart = null;
function e1rm(weight, reps) {
  if (weight == null || reps == null) return null;
  return weight * (1 + reps / 30);
}

function renderPRBox(entries) {
  const pr = $("#prBox");
  if (entries.length === 0) { pr.textContent = "Aucune donnée pour cet exercice."; return; }

  const maxWeight = Math.max(...entries.map(e => e.weight ?? -Infinity));
  const maxReps = Math.max(...entries.map(e => e.reps ?? -Infinity));
  const maxE1rm = Math.max(...entries.map(e => e1rm(e.weight, e.reps) ?? -Infinity));

  const wTxt = (maxWeight === -Infinity) ? "—" : `${maxWeight} kg`;
  const rTxt = (maxReps === -Infinity) ? "—" : `${maxReps} reps`;
  const eTxt = (maxE1rm === -Infinity) ? "—" : `${maxE1rm.toFixed(1)} kg`;

  pr.innerHTML = `
    <div><strong>Records (sur tes entrées)</strong></div>
    <div>Poids max: ${wTxt}</div>
    <div>Reps max: ${rTxt}</div>
    <div>e1RM max: ${eTxt}</div>
  `;
}

function renderStats() {
  const exName = $("#statsExercise").value;
  const metric = $("#metric").value;

  const entries = state.entries
    .filter(e => e.exercise === exName)
    .slice()
    .sort((a,b)=>a.date.localeCompare(b.date));

  renderPRBox(entries);

  const labels = entries.map(e => e.date);
  const data = entries.map(e => {
    if (metric === "weight") return e.weight;
    if (metric === "reps") return e.reps;
    if (metric === "e1rm") return e1rm(e.weight, e.reps);
    return null;
  });

  const clean = labels.map((lab, i) => ({ lab, val: data[i] }))
    .filter(x => x.val != null);

  const finalLabels = clean.map(x => x.lab);
  const finalData = clean.map(x => x.val);

  const ctx = $("#chart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: finalLabels,
      datasets: [{ label: `${exName} — ${metric}`, data: finalData, tension: 0.2 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } }
    }
  });
}

$("#statsExercise").addEventListener("change", renderStats);
$("#metric").addEventListener("change", renderStats);

// ---------- Bodyweight
let bwChart = null;

function deleteBW(id) {
  state.bodyweights = state.bodyweights.filter(x => x.id !== id);
  saveData();
  renderBody();
}

$("#bwForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const date = $("#bwDate").value;
  const w = Number($("#bw").value);
  state.bodyweights.push({ id: uid(), date, weight: w });
  saveData();
  renderBody();
  $("#bw").value = "";
});

function renderBody() {
  const rows = state.bodyweights.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const labels = rows.map(r => r.date);
  const data = rows.map(r => r.weight);

  const ctx = $("#bwChart");
  if (bwChart) bwChart.destroy();
  bwChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label: "Poids (kg)", data, tension: 0.2 }] },
    options: { responsive: true, plugins: { legend: { display:false } } }
  });

  const tbody = $("#bwTable tbody");
  tbody.innerHTML = "";
  rows.slice().reverse().forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.weight}</td>
      <td><button class="ghost" data-del="${r.id}">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => deleteBW(btn.dataset.del));
  });
}

// ---------- Backup
function getExportJson() {
  return JSON.stringify(state, null, 2);
}

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([getExportJson()], { type: "application/json" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `gym-tracker-backup-${todayISO()}.json`;
  a.click();

  // Safari iOS peut échouer si on révoque trop tôt.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("#extractBtn").addEventListener("click", async () => {
  const output = $("#extractOutput");
  output.value = getExportJson();
  output.focus();
  output.select();

  try {
    await navigator.clipboard.writeText(output.value);
    alert("JSON copié dans le presse-papiers.");
  } catch {
    alert("JSON affiché ci-dessous. Copie manuelle si besoin.");
  }
});

$("#importFile").addEventListener("change", async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.entries) || !Array.isArray(data.bodyweights) || !Array.isArray(data.exercises)) {
      alert("Fichier invalide.");
      return;
    }
    state.entries = data.entries;
    state.bodyweights = data.bodyweights;
    state.exercises = data.exercises;
    saveData();
    refreshAll();
    alert("Import OK !");
  } catch {
    alert("Impossible d'importer ce fichier.");
  } finally {
    ev.target.value = "";
  }
});

$("#wipeBtn").addEventListener("click", () => {
  const ok = confirm("Tout effacer sur CET appareil ? (tu peux exporter avant)");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// ---------- Refresh everything
function refreshAll() {
  refreshExerciseDatalist();
  refreshFilterExerciseSelect();
  refreshStatsExerciseSelect();
  renderRecent();
  renderHistory();
  renderStats();
  renderBody();
}

// init
$("#date").value = todayISO();
$("#bwDate").value = todayISO();
refreshAll();
updateExerciseHint();
setTab("log");
