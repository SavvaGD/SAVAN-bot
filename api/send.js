// api/send.js
export default async function handler(req, res) {
  // Разрешаем запросы с любого домена (CORS), чтобы твой сайт на GitHub мог отправлять данные
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка preflight запроса от браузера
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone } = req.body;
    const TG_TOKEN = process.env.TG_TOKEN;
    const TG_CHAT_ID = process.env.TG_CHAT_ID;

    const text = `🔥 *Новая заявка с сайта!*\n\n👤 *Имя:* ${name}\n📞 *Телефон:* ${phone}`;
    const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    const response = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      throw new Error('Telegram error');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
