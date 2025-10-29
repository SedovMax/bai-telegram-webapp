# BAI Telegram WebApp — Starter

Минимальный каркас Telegram WebApp для шкалы тревоги Бека (BAI).

## Как запустить локально
Откройте `index.html` в браузере двойным кликом. Для разработки Telegram SDK не обязателен.

## Как задеплоить на Vercel (без кода)
1. Создайте аккаунт: https://vercel.com
2. Вверху **Add New → Project → Import** → перетащите папку с этими файлами.
3. Vercel создаст сайт и выдаст HTTPS-URL вида `https://bai-app.vercel.app`.
4. Этот URL используйте как WebApp URL в боте.

## Интеграция с Telegram
- В BotFather создайте бота, получите токен.
- В коде бота используйте `reply_markup` с `web_app: { url: "<ваш URL>" }`.
- Пример для Python aiogram/pyTelegramBotAPI смотрите в документации (добавьте по мере готовности).

## Интеграция с Supabase (добавите позже)
- Создайте проект на https://supabase.com (Free tier).
- Таблица `results`: tg_user_id, total_score, level, answers (json), created_at.
- Подключите supabase-js и сохранение результата в `app.js` (см. TODO).

> В этом стартере сохранения на сервер нет — это первый шаг: интерфейс и логика подсчёта.
