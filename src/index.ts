import "dotenv/config";
import { Bot } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is not set");

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  await ctx.reply("Привет! Я помогу проверить, не попали ли твои данные в известные утечки!");
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});


bot.start();
