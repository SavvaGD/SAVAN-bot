export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing name or phone' });
    }

    const text = `🔥 *Новая заявка/покупка!*\n\n👤 *Имя:* ${name}\n📞 *Контакт/Детали:* ${phone}`;
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
      const errData = await response.json();
      console.error('Telegram Error:', errData);
      return res.status(500).json({ success: false, error: 'Telegram API error' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}