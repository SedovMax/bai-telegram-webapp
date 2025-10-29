// Минимальная логика без внешних библиотек
// Поддерживает запуск как внутри Telegram WebApp, так и в обычном браузере (для разработки).

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

const $ = (sel) => document.querySelector(sel);
const screenStart = $("#screen-start");
const screenTest = $("#screen-test");
const screenResult = $("#screen-result");
const btnStart = $("#btn-start");
const btnPrev = $("#btn-prev");
const btnNext = $("#btn-next");
const btnRestart = $("#btn-restart");
const questionBlock = $("#question-block");
const progressText = $("#progress-text");
const totalScoreEl = $("#total-score");
const levelTextEl = $("#level-text");

let index = 0;
let answers = Array(QUESTIONS.length).fill(null);

function showScreen(name) {
  screenStart.classList.toggle("hidden", name !== "start");
  screenTest.classList.toggle("hidden", name !== "test");
  screenResult.classList.toggle("hidden", name !== "result");
}

function renderQuestion() {
  progressText.textContent = `Вопрос ${index + 1} / ${QUESTIONS.length}`;
  questionBlock.textContent = QUESTIONS[index];

  // Сброс radio и восстановление ответа, если был
  const radios = document.querySelectorAll('input[name="score"]');
  radios.forEach(r => { r.checked = false; });
  if (answers[index] !== null) {
    const toCheck = document.querySelector(`input[name="score"][value="${answers[index]}"]`);
    if (toCheck) toCheck.checked = true;
  }

  // Кнопки навигации
  btnPrev.disabled = index === 0;
  btnNext.textContent = index === QUESTIONS.length - 1 ? "Завершить" : "Далее";
}

function computeLevel(total) {
  if (total <= 21) return "низкий";
  if (total <= 35) return "средний";
  return "высокий (потенциально опасный)";
}

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
  // Читаем выбранный ответ
  const sel = document.querySelector('input[name="score"]:checked');
  if (!sel) {
    alert("Выберите вариант ответа (0–3).");
    return;
  }
  answers[index] = Number(sel.value);

  if (index < QUESTIONS.length - 1) {
    index += 1;
    renderQuestion();
  } else {
    // Подсчёт результата
    const total = answers.reduce((a, b) => a + b, 0);
    const level = computeLevel(total);
    totalScoreEl.textContent = String(total);
    levelTextEl.textContent = level;
    showScreen("result");

    // TODO: интеграция с Supabase для сохранения результата
    // saveResult(total, level, answers)
  }
});

btnRestart.addEventListener("click", () => {
  showScreen("start");
});

// Попытка инициализировать Telegram WebApp (если доступно)
(function initTelegram() {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Можно настроить тему, mainButton и т.д. при необходимости
    }
  } catch (e) {
    // молча игнорируем в браузере
  }
})();

// Поддержка клавиатуры: цифры 0-3 для быстрого выбора
document.addEventListener("keydown", (e) => {
  const map = { "0": 0, "1": 1, "2": 2, "3": 3 };
  if (screenTest.classList.contains("hidden")) return;
  if (e.key in map) {
    const val = map[e.key];
    const el = document.querySelector(`input[name="score"][value="${val}"]`);
    if (el) {
      el.checked = true;
    }
  }
});
