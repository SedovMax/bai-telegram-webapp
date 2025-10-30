console.log("BAI v3.1 (Chart.js UMD) loaded");

// === ДАННЫЕ ТЕСТА ===
const QUESTIONS = [
  "Ощущение онемения или покалывания в теле",
  "Ощущение жары",
  "Дрожь в ногах",
  "Неспособность расслабиться",
  "Страх, что произойдет самое плохое",
  "Головокружение или ощущение легкости в голове",
  "Ускоренное сердцебиение",
  "Неустойчивость",
  "Ощущение ужаса",
  "Нервозность",
  "Дрожь в руках",
  "Ощущение удушья",
  "Шаткость походки",
  "Страх утраты контроля",
  "Затрудненность дыхания",
  "Страх смерти",
  "Испуг",
  "Желудочно-кишечные расстройства",
  "Обмороки",
  "Приливы крови к лицу",
  "Усиление потоотделения (не связанное с жарой)",
];

// initData приходит ТОЛЬКО внутри Telegram
const tgInitData = (window?.Telegram?.WebApp?.initData) || "";

// Код уровня для БД (англ)
function computeLevelCode(total) {
  if (total <= 21) return "low";
  if (total <= 35) return "medium";
  return "high";
}

// === УТИЛИТЫ ===
const $ = (sel) => document.querySelector(sel);
const screenStart = $("#screen-start");
const screenTest = $("#screen-test");
const screenResult = $("#screen-result");
const screenHistory = $("#screen-history");

const btnStart = $("#btn-start");
const btnPrev = $("#btn-prev");
const btnNext = $("#btn-next");
const btnRestart = $("#btn-restart");

const btnSave = document.getElementById("btn-save");
const navHistory = document.getElementById("nav-history");

const totalScoreEl = $("#total-score");
const levelTextEl = $("#level-text");
const progressText = $("#progress-text");
const questionBlock = $("#question-block");

const navStart = $("#nav-start");
const navHistory = $("#nav-history");

const historyList = $("#history-list");
const btnExport = $("#btn-export");
const btnClear = $("#btn-clear");

let historyChart = null;
let index = 0;
let answers = Array(QUESTIONS.length).fill(null);
let lastTotal = null;
let lastLevel = null;

// === ЭКРАНЫ ===
function showScreen(name) {
  screenStart.classList.toggle("hidden", name !== "start");
  screenTest.classList.toggle("hidden", name !== "test");
  screenResult.classList.toggle("hidden", name !== "result");
  screenHistory.classList.toggle("hidden", name !== "history");
}

function renderQuestion() {
  progressText.textContent = `Вопрос ${index + 1} / ${QUESTIONS.length}`;
  questionBlock.textContent = QUESTIONS[index];

  const radios = document.querySelectorAll('input[name="score"]');
  radios.forEach(r => { r.checked = false; });
  if (answers[index] !== null) {
    const toCheck = document.querySelector(`input[name="score"][value="${answers[index]}"]`);
    if (toCheck) toCheck.checked = true;
  }

  btnPrev.disabled = index === 0;
  btnNext.textContent = index === QUESTIONS.length - 1 ? "Завершить" : "Далее";
}

function computeLevel(total) {
  if (total <= 21) return "низкий";
  if (total <= 35) return "средний";
  return "высокий (потенциально опасный)";
}

// === ЛОКАЛЬНАЯ ИСТОРИЯ ===
function getHistory() {
  try { return JSON.parse(localStorage.getItem("bai_results") || "[]"); }
  catch { return []; }
}
function setHistory(arr) {
  localStorage.setItem("bai_results", JSON.stringify(arr));
}
function saveLastToHistory() {
  if (lastTotal == null) return;
  const entry = {
    timestamp: new Date().toISOString(),
    total_score: lastTotal,
    level: lastLevel,
    answers
  };
  const history = getHistory();
  history.push(entry);
  setHistory(history);
  alert("Результат сохранён на этом устройстве. Откройте вкладку «История».");
}
function renderHistoryList() {
  const data = getHistory();
  if (data.length === 0) {
    historyList.innerHTML = '<p class="muted">Пока нет сохранённых результатов.</p>';
    return;
  }
  historyList.innerHTML = "";
  data.slice().reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    const dt = new Date(item.timestamp);
    const dateText = dt.toLocaleString();
    div.innerHTML = `
      <div>
        <div><strong>${item.total_score}</strong> / 63 — ${item.level}</div>
        <div class="muted">${dateText}</div>
      </div>
      <span class="badge">21×0–3</span>
    `;
    historyList.appendChild(div);
  });
}

// === ГРАФИК ===
function renderHistoryChart() {
  const sorted = getHistory().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const values = sorted.map(d => d.total_score);
  const labels = sorted.map(d => {
    const dt = new Date(d.timestamp);
    return dt.toLocaleDateString() + " " + dt.toLocaleTimeString().slice(0,5);
  });

  const ctx = document.getElementById("history-chart");
  if (!ctx) return;

  if (historyChart) historyChart.destroy();

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Баллы BAI",
        data: values,
        fill: false,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { suggestedMin: 0, suggestedMax: 63, ticks: { stepSize: 5 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const i = items[0].dataIndex;
              const v = values[i];
              const level = v <= 21 ? "низкий" : v <= 35 ? "средний" : "высокий";
              return `Уровень: ${level}`;
            }
          }
        }
      }
    }
  });
}

// --- Облако: сохранить результат в Supabase через наш API ---
async function saveCloud(total, answers) {
  const levelCode = computeLevelCode(total); // "low" | "medium" | "high"
  try {
    const r = await fetch("/api/results/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: tgInitData,
        total_score: total,
        level: levelCode,
        answers
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "save_failed");
    alert("Результат сохранён в облаке.");
  } catch (e) {
    console.error(e);
    alert("Не удалось сохранить в облако. Откройте WebApp внутри Telegram или проверьте сеть.");
  }
}

// --- Облако: получить историю ---
async function fetchCloudHistory(limit = 100) {
  const r = await fetch(`/api/results/list?limit=${limit}`, {
    headers: { "x-telegram-init-data": tgInitData }
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "list_failed");
  return data.items || [];
}

// --- Облако: отрисовать историю (список + график) ---
async function renderHistoryFromCloud() {
  try {
    const items = await fetchCloudHistory(100);

    // список
    const list = document.getElementById("history-list");
    if (!items.length) {
      list.innerHTML = '<p class="muted">В облаке пока нет результатов.</p>';
    } else {
      list.innerHTML = "";
      items.forEach(item => {
        const dt = new Date(item.created_at);
        const el = document.createElement("div");
        el.className = "history-item";
        el.innerHTML = `
          <div>
            <div><strong>${item.total_score}</strong> / 63 — ${item.level}</div>
            <div class="muted">${dt.toLocaleString()}</div>
          </div>
          <span class="badge">облако</span>
        `;
        list.appendChild(el);
      });
    }

    // график
    const sorted = items.slice().sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    const labels = sorted.map(d => {
      const dt = new Date(d.created_at);
      return dt.toLocaleDateString() + " " + dt.toLocaleTimeString().slice(0,5);
    });
    const values = sorted.map(d => d.total_score);

    if (window.historyChart) window.historyChart.destroy();
    const ctx = document.getElementById("history-chart");
    window.historyChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Баллы BAI", data: values, fill: false, tension: 0.25 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { suggestedMin: 0, suggestedMax: 63 } },
        plugins: { legend: { display: false } }
      }
    });
  } catch (e) {
    console.error(e);
    alert("Не удалось загрузить историю из облака. Откройте WebApp внутри Telegram?");
  }
}



// === ОБРАБОТЧИКИ ===
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btn-save") {
    saveLastToHistory();
  }
});

btnStart.addEventListener("click", () => {
  index = 0;
  answers = Array(QUESTIONS.length).fill(null);
  showScreen("test");
  renderQuestion();
});

btnPrev.addEventListener("click", () => {
  index = Math.max(0, index - 1);
  renderQuestion();
});

btnNext.addEventListener("click", () => {
  const sel = document.querySelector('input[name="score"]:checked');
  if (!sel) { alert("Выберите вариант ответа (0–3)."); return; }
  answers[index] = Number(sel.value);

  if (index < QUESTIONS.length - 1) {
    index += 1;
    renderQuestion();
  } else {
    const total = answers.reduce((a, b) => a + b, 0);
    const level = computeLevel(total);
    lastTotal = total; lastLevel = level;
    totalScoreEl.textContent = String(total);
    levelTextEl.textContent = level;
    showScreen("result");
  }
});

btnRestart.addEventListener("click", () => showScreen("start"));

navStart.addEventListener("click", () => showScreen("start"));
navHistory.addEventListener("click", () => {
  renderHistoryFromCloud();  // теперь берём данные из Supabase
  showScreen("history");
});


btnExport.addEventListener("click", () => {
  const data = getHistory();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "bai_results.json"; a.click();
  URL.revokeObjectURL(url);
});

btnClear.addEventListener("click", () => {
  if (confirm("Очистить локальную историю на этом устройстве?")) {
    localStorage.removeItem("bai_results");
    if (historyChart) historyChart.destroy();
    renderHistoryList();
  }
});

if (btnSave) {
  btnSave.addEventListener("click", async () => {
    // Можно оставить локальное сохранение как резерв:
    // saveLastToHistory();

    // Сохраняем результат в облако (Supabase)
    await saveCloud(lastTotal, answers);
  });
}



// === Telegram WebApp init (не мешает в браузере) ===
(function initTelegram() {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  } catch (e) {}
})();

// === Горячие клавиши ===
document.addEventListener("keydown", (e) => {
  const map = { "0": 0, "1": 1, "2": 2, "3": 3 };
  if (screenTest.classList.contains("hidden")) return;
  if (e.key in map) {
    const val = map[e.key];
    const el = document.querySelector(`input[name="score"][value="${val}"]`);
    if (el) el.checked = true;
  }
});
