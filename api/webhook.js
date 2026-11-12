const { Telegraf, Markup, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.TG_TOKEN);
const ADMIN_ID = process.env.TG_CHAT_ID;

// --- ФУНКЦИИ ВАЛИДАЦИИ ---
const badWords = ['хуй', 'пизд', 'ебал', 'ебат', 'бляд', 'сука', 'дроч', 'говн', 'муд', 'залуп', 'пидор', 'гандон', 'шлюх'];

function validateName(name) {
  if (!name) return 'Имя не может быть пустым.';
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 30) return 'Имя должно быть от 2 до 30 символов.';
  if ((cleanName.match(/ /g) || []).length > 2) return 'Имя не должно содержать больше 3 слов.';
  if (!/^[а-яА-ЯёЁa-zA-Z\s]+$/.test(cleanName)) return 'Имя должно содержать только буквы.';
  if (badWords.some(word => cleanName.toLowerCase().includes(word))) return 'Пожалуйста, используй настоящее имя.';
  return null;
}

function validateContact(contact) {
  if (!contact) return 'Контакт не может быть пустым.';
  const cleanContact = contact.trim();
  if (cleanContact.length > 50) return 'Контакт слишком длинный.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
  if (emailRegex.test(cleanContact)) return null;
  if (phoneRegex.test(cleanContact)) {
    const digitsCount = cleanContact.replace(/\D/g, '').length;
    if (digitsCount >= 10 && digitsCount <= 15) return null;
    return 'Номер телефона должен содержать от 10 до 15 цифр.';
  }
  return 'Пожалуйста, укажи корректный номер телефона или Email.';
}

// --- СЦЕНА ЗАПИСИ ---
const signupScene = new Scenes.WizardScene(
  'SIGNUP_SCENE',
  (ctx) => {
    ctx.reply('Как тебя зовут? (Только буквы, без цифр и эмодзи)');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return ctx.reply('Пожалуйста, напиши текстом.');
    const error = validateName(ctx.message.text);
    if (error) return ctx.reply(`❌ Ошибка: ${error}\nПопробуй еще раз. Как тебя зовут?`);
    ctx.wizard.state.name = ctx.message.text.trim();
    ctx.reply(`Приятно познакомиться, ${ctx.wizard.state.name}! Оставь свой номер телефона или Email для связи.`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) return ctx.reply('Пожалуйста, напиши текстом.');
    const error = validateContact(ctx.message.text);
    if (error) return ctx.reply(`❌ Ошибка: ${error}\nПопробуй еще раз.`);
    const contact = ctx.message.text.trim();
    const name = ctx.wizard.state.name;
    try {
      await bot.telegram.sendMessage(ADMIN_ID, `🔥 *Новая заявка!*\n\n👤 *Имя:* ${name}\n📞 *Контакт:* ${contact}\n🔗 *Юзернейм:* @${ctx.from.username || 'нет'}`, { parse_mode: 'Markdown' });
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

bot.start((ctx) => {
  ctx.replyWithMarkdown(`Привет, ${ctx.from.first_name}! 👋\n\nЭто бот школы программирования *SAVAN*.\nЗдесь мы учим создавать игры и писать код на Python, C и Unreal Engine.`);
  showMainMenu(ctx);
});

bot.command('sign', (ctx) => ctx.scene.enter('SIGNUP_SCENE'));
bot.hears('🚀 Записаться (/sign)', (ctx) => ctx.scene.enter('SIGNUP_SCENE'));

const coursesText = `📚 *Наши курсы:*\n\n🐻 *Ursula* — 3D-миры на Godot\n🧩 *Scratch* — 2D-игры\n💻 *Python* — терминальные игры\n⚙️ *C* — продвинутый уровень\n🕹️ *C + Raylib* — 2D-игры\n🎮 *Unreal Engine* — 3D-игры\n\nЧтобы записаться, нажми /sign`;
bot.command('courses', (ctx) => ctx.replyWithMarkdown(coursesText));
bot.hears('📚 Курсы (/courses)', (ctx) => ctx.replyWithMarkdown(coursesText));

bot.command('site', (ctx) => {
  const siteUrl = 'https://savanschool.site';
  ctx.reply('🌐 Наш официальный сайт:', Markup.inlineKeyboard([Markup.button.url('Открыть сайт SAVAN', siteUrl)]));
});
bot.hears('🌐 Сайт (/site)', (ctx) => {
  const siteUrl = 'https://savanschool.site';
  ctx.reply('🌐 Наш официальный сайт:', Markup.inlineKeyboard([Markup.button.url('Открыть сайт SAVAN', siteUrl)]));
});

// Секретная команда для приема заявок с сайта
bot.command('notify_buy', async (ctx) => {
  const text = ctx.message.text.replace('/notify_buy ', '');
  if (text) {
    await ctx.reply(`🔥 *Новая заявка с сайта!*\n\n${text}`, { parse_mode: 'Markdown' });
  }
});

// --- ЭКСПОРТ ДЛЯ VERCEL ---
module.exports = async (req, res) => {
  // Разрешаем CORS для запросов с сайта
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ЗАГЛУШКА ДЛЯ CRON-JOB (если пришел пустой GET-запрос)
  if (req.method === 'GET') {
    return res.status(200).send('Bot is alive');
  }

  try {
    // Если это не сообщение от Telegram, бот просто проигнорирует его без ошибки
    if (!req.body || !req.body.update_id) {
       return res.status(200).send('OK');
    }
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(200).send('Error handled'); // Отвечаем 200, чтобы Cron-job не ругался
  }
};
