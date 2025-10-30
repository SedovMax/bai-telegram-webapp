import { createClient } from "@supabase/supabase-js";
import { verifyTelegramInitData } from "./_verify.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, TELEGRAM_BOT_TOKEN } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({ error: "env_not_configured" });
  }

  try {
    const initData = req.headers["x-telegram-init-data"] || req.query.initData;
    const verified = verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN);
    if (!verified) return res.status(401).json({ error: "invalid_init_data" });

    const tg_user_id = Number(verified.user.id);
    const limit = Math.min(Number(req.query.limit || 100), 200);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("results")
      .select("id, total_score, level, answers, created_at")
      .eq("tg_user_id", tg_user_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return res.status(200).json({ items: data || [] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}
