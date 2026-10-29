const { Telegraf, Markup } = require('telegraf');

// Токен и ID берутся из переменных окружения Vercel
const bot = new Telegraf(process.env.TG_TOKEN);
const ADMIN_ID = process.env.TG_CHAT_ID;

// Обработка /start
bot.start((ctx) => {
  const keyboard = Markup.keyboard([
    ['🚀 Записаться на пробное занятие'],
    ['📚 Узнать о курсах']
  ]).resize();

  ctx.replyWithMarkdown(`Привет, ${ctx.from.first_name}! 👋\n\nЭто бот школы программирования *SAVAN*.\nЗдесь мы учим создавать игры и писать код на Python, C и Unreal Engine.\n\nВыбери, что тебя интересует:`, keyboard);
});

// Обработка "Узнать о курсах"
bot.hears('📚 Узнать о курсах', (ctx) => {
  ctx.replyWithMarkdown(`📚 *Наши курсы:*\n\n🐻 *Ursula* — 3D-миры на Godot для новичков\n🧩 *Scratch* — блочное программирование 2D-игр\n💻 *Python* — терминальные игры и основы кода\n⚙️ *C* — продвинутый уровень (память, указатели)\n🕹️ *C + Raylib* — создание 2D-игр\n🎮 *Unreal Engine* — 3D-игры и Blueprints\n\nНажми «🚀 Записаться на пробное занятие», чтобы попробовать бесплатно!`);
});

// Обработка "Записаться"
bot.hears('🚀 Записаться на пробное занятие', (ctx) => {
  ctx.reply('Как тебя зовут?');
  bot.once('text', (nameCtx) => {
    const name = nameCtx.message.text;
    nameCtx.reply(`Приятно познакомиться, ${name}! Оставь свой номер телефона или ник в Telegram для связи с Саввой.`);
    
    bot.once('text', async (phoneCtx) => {
      const phone = phoneCtx.message.text;
      
      // Отправляем тебе
      try {
        await bot.telegram.sendMessage(ADMIN_ID, `🔥 *Новая заявка из бота!*\n\n👤 *Имя:* ${name}\n📞 *Контакт:* ${phone}\n🔗 *Юзернейм:* @${phoneCtx.from.username || 'нет'}`, { parse_mode: 'Markdown' });
        await phoneCtx.reply('Отлично! Заявка отправлена. Савва свяжется с тобой в ближайшее время. 🚀');
      } catch (e) {
        console.error(e);
        await phoneCtx.reply('Ой, произошла ошибка при отправке. Попробуй позже.');
      }
    });
  });
});

// Экспортируем функцию для Vercel (Webhook)
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};
