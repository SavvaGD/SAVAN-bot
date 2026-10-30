const { Telegraf, Markup, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.TG_TOKEN);
const ADMIN_ID = process.env.TG_CHAT_ID;

// --- СЦЕНА ЗАПИСИ ---
const signupScene = new Scenes.WizardScene(
  'SIGNUP_SCENE',
  (ctx) => {
    ctx.reply('Как тебя зовут?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return ctx.reply('Пожалуйста, напиши текстом.');
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply(`Приятно познакомиться, ${ctx.wizard.state.name}! Оставь свой номер телефона или ник в Telegram для связи.`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) return ctx.reply('Пожалуйста, напиши текстом.');
    const phone = ctx.message.text;
    const name = ctx.wizard.state.name;

    try {
      await bot.telegram.sendMessage(ADMIN_ID, `🔥 *Новая заявка!*\n\n👤 *Имя:* ${name}\n📞 *Контакт:* ${phone}\n🔗 *Юзернейм:* @${ctx.from.username || 'нет'}`, { parse_mode: 'Markdown' });
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
    ['🚀 Записаться (/sign)'],
    ['📚 Курсы (/courses)'],
    ['🌐 Сайт (/site)']
  ]).resize();
  return ctx.reply('Выбери действие:', keyboard);
}

const stage = new Scenes.Stage([signupScene]);
bot.use(session());
bot.use(stage.middleware());

// --- ОБРАБОТКА КОМАНД ---

// 1. Команда /start
bot.start((ctx) => {
  ctx.replyWithMarkdown(`Привет, ${ctx.from.first_name}! 👋\n\nЭто бот школы программирования *SAVAN*.\nЗдесь мы учим создавать игры и писать код на Python, C и Unreal Engine.`);
  showMainMenu(ctx);
});

// 2. Команда /sign (и кнопка "Записаться")
bot.command('sign', (ctx) => ctx.scene.enter('SIGNUP_SCENE'));
bot.hears('🚀 Записаться (/sign)', (ctx) => ctx.scene.enter('SIGNUP_SCENE'));

// 3. Команда /courses (и кнопка "Курсы")
const coursesText = `📚 *Наши курсы:*\n\n🐻 *Ursula* — 3D-миры на Godot для новичков\n🧩 *Scratch* — блочное программирование 2D-игр\n💻 *Python* — терминальные игры и основы кода\n⚙️ *C* — продвинутый уровень (память, указатели)\n🕹️ *C + Raylib* — создание 2D-игр\n🎮 *Unreal Engine* — 3D-игры и Blueprints\n\nЧтобы записаться, нажми /sign`;
bot.command('courses', (ctx) => ctx.replyWithMarkdown(coursesText));
bot.hears('📚 Курсы (/courses)', (ctx) => ctx.replyWithMarkdown(coursesText));

// 4. Команда /site (и кнопка "Сайт")
bot.command('site', (ctx) => {
  // ВАЖНО: Замени ссылку на свой реальный сайт, если она другая
  const siteUrl = 'https://savavgd.github.io/SAVAN-site/'; 
  ctx.reply(`🌐 Наш сайт: ${siteUrl}`, Markup.inlineKeyboard([
    Markup.button.url('Открыть сайт', siteUrl)
  ]));
});
bot.hears('🌐 Сайт (/site)', (ctx) => {
  const siteUrl = 'https://savavgd.github.io/SAVAN-site/'; 
  ctx.reply(`🌐 Наш сайт: ${siteUrl}`, Markup.inlineKeyboard([
    Markup.button.url('Открыть сайт', siteUrl)
  ]));
});

// Экспорт для Vercel
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};
