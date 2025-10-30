console.log("BAI v3.2 SAFE build loaded");

const insideTelegram = !!window?.Telegram?.WebApp?.initData;
console.log("insideTelegram:", insideTelegram);

// initData (если WebApp открыт в Telegram)
const tgInitData = (window?.Telegram?.WebApp?.initData) || "";

// Вопросы BAI
const QUESTIONS = [
  "1. Онемение или покалывание",
  "2. Ощущение жара",
  "3. Дрожь в ногах",
  "4. Неспособность расслабиться",
  "5. Страх, что произойдет что-то ужасное",
  "6. Головокружение или ощущение легкости в голове",
  "7. Учащённое сердцебиение",
  "8. Неустойчивость",
  "9. Ощущение ужаса",
  "10. Нервозность",
  "11. Ощущение удушья",
  "12. Дрожь в руках",
  "13. Дрожь по всему телу",
  "14. Страх потери контроля",
  "15. Одышка",
  "16. Страх смерти",
  "17. Испуг",
  "18. Желудочно-кишечные расстройства",
  "19. Обморочное состояние",
  "20. Приливы жара",
  "21. Озноб или дрожь"
];

let currentIndex = 0;
let answers = new Array(QUESTIONS.length).fill(null);
let lastTotal = 0;

// Элементы
const btnStart = document.getElementById("btn-start");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnRestart = document.getElementById("btn-restart");
const btnSave = document.getElementById("btn-save");
const navStart = document.getElementById("nav-start");
const navHistory = document.getElementById("nav-history");

// Переход между экранами
function showScreen(id) {
  document.querySelectorAll("main").forEach(el => el.classList.add("hidden"));
  document.getElementById(`screen-${id}`).classList.remove("hidden");
}

// Отрисовка вопроса
function renderQuestion() {
  document.getElementById("progress-text").textContent = `Вопрос ${currentIndex + 1} / ${QUESTIONS.length}`;
  document.getElementById("question-block").textContent = QUESTIONS[currentIndex];

  const val = answers[currentIndex];
  document.querySelectorAll('input[name="score"]').forEach(r => r.checked = (parseInt(r.value) === val));
}

// Подсчет результата
function calculateTotal() {
  const total = answers.reduce((sum, v) => sum + (v ?? 0), 0);
  lastTotal = total;

  let level = "низкий";
  if (total > 21 && total <= 35) level = "умеренный";
  else if (total > 35) level = "высокий";

  document.getElementById("total-score").textContent = total;
  document.getElementById("level-text").textContent = level;
}

// ==== Облако (Supabase) ====

function computeLevelCode(total) {
  if (total <= 21) return "low";
  if (total <= 35) return "medium";
  return "high";
}

async function saveCloud(total, answers) {
  if (!insideTelegram) {
    alert("Облачное сохранение доступно только в Telegram. Результат сохранён локально.");
    saveLastToHistory();
    return;
  }

  try {
    const r = await fetch("/api/results/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: tgInitData,
        total_score: total,
        level: computeLevelCode(total),
        answers
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "save_failed");
    alert("Результат сохранён в облаке (Supabase).");
  } catch (e) {
    console.error(e);
    alert("Не удалось сохранить в облако. Проверьте интернет или откройте внутри Telegram.");
  }
}

async function fetchCloudHistory(limit = 100) {
  const r = await fetch(`/api/results/list?limit=${limit}`, {
    headers: { "x-telegram-init-data": tgInitData }
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "list_failed");
  return data.items || [];
}

async function renderHistoryFromCloud() {
  t
