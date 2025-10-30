import crypto from "crypto";

/**
 * Проверка Telegram initData.
 * @param {string} initData - Telegram.WebApp.initData
 * @param {string} botToken - токен бота из BotFather
 * @returns {object|null} { user, params } или null, если подпись невалидна
 */
export function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return null;
  urlParams.delete("hash");

  // data_check_string
  const dataCheckArr = [];
  for (const [key, value] of urlParams.entries()) dataCheckArr.push(`${key}=${value}`);
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  // secret = sha256(botToken)
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const calcHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (calcHash !== hash) return null;

  // user
  const userJson = urlParams.get("user");
  let user = null;
  try { user = JSON.parse(userJson); } catch {}
  if (!user || !user.id) return null;

  return { user, params: urlParams };
}
