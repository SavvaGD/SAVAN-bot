const { Telegraf, Markup, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.TG_TOKEN);
const ADMIN_ID = process.env.TG_CHAT_ID;

// --- СЦЕНА ЗАПИСИ ---
const signupScene = new Scenes.WizardScene(
  'SIGNUP_SCENE',
  // Шаг 1: Спрашиваем имя
  (ctx) => {
    ctx.reply('Как тебя зовут?');
    return ctx.wizard.next();
  },
  // Шаг 2: Спрашиваем телефон
  (ctx) => {
    // Проверка, что пользователь отправил текст
    if (!ctx.message || !ctx.message.text) {
      return ctx.reply('Пожалуйста, напиши текстом.');
    }
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply(`Приятно познакомиться, ${ctx.wizard.state.name}! Оставь свой номер телефона или ник в Telegram для связи.`);
    return ctx.wizard.next();
  },
  // Шаг 3: Получаем телефон, отправляем админу и завершаем
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      return ctx.reply('Пожалуйста, напиши текстом.');
    }
    const phone = ctx.message.text;
    const name = ctx.wizard.state.name;

    try {
      // Отправляем тебе
      await bot.telegram.sendMessage(ADMIN_ID, `🔥 *Новая заявка из бота!*\n\n👤 *Имя:* ${name}\n📞 *Контакт:* ${phone}\n🔗 *Юзернейм:* @${ctx.from.username || 'нет'}`, { parse_mode: 'Markdown' });
      
      // Отвечаем пользователю и возвращаем главное меню
      await ctx.reply('Отлично! Заявка отправлена. Савва свяжется с тобой в ближайшее время. 🚀');
      await ctx.scene.leave();
      return showMainMenu(ctx);
    } catch (e) {
      console.error(e);
      await ctx.reply('Ой, произошла ошибка при отправке. Попробуй позже.');
      return ctx.scene.leave();
    }
  }
);

// Функция для показа главного меню
function showMainMenu(ctx) {
  const keyboard = Markup.keyboard([
    ['🚀 Записаться на пробное занятие'],
    ['📚 Узнать о курсах']
  ]).resize();
  return ctx.reply('Что-нибудь еще?', keyboard);
}

// --- НАСТРОЙКА БОТА ---
const stage = new Scenes.Stage([signupScene]);
bot.use(session());
bot.use(stage.middleware());

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
  ctx.scene.enter('SIGNUP_SCENE');
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
