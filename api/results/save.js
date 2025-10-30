import { createClient } from "@supabase/supabase-js";
import { verifyTelegramInitData } from "./_verify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, TELEGRAM_BOT_TOKEN } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({ error: "env_not_configured" });
  }

  try {
    const { initData, total_score, level, answers } = req.body || {};
    const verified = verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN);
    if (!verified) return res.status(401).json({ error: "invalid_init_data" });

    const tg_user_id = Number(verified.user.id);
    if (!Number.isFinite(tg_user_id)) return res.status(400).json({ error: "invalid_user_id" });

    if (!Array.isArray(answers) || answers.length !== 21) {
      return res.status(400).json({ error: "answers_invalid" });
    }
    if (!Number.isFinite(total_score) || total_score < 0 || total_score > 63) {
      return res.status(400).json({ error: "total_score_invalid" });
    }
    if (!["low", "medium", "high"].includes(level)) {
      return res.status(400).json({ error: "level_invalid" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
    const { error } = await supabase.from("results").insert({
      tg_user_id, total_score, level, answers
    });
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}
