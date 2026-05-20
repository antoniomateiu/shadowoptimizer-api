const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { clientId, productId, originalText } = req.body;

    if (!clientId || !productId || !originalText) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Genereaza varianta AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Tu esti un copywriter expert. Genereaza o descriere de produs mai persuasiva, scurta (max 100 cuvinte), care sa creasca conversii.'
        },
        {
          role: 'user',
          content: `Descrierea originala: "${originalText}"\n\nGenereaza o varianta mai persuasiva.`
        }
      ],
      max_tokens: 150
    });

    const aiVariant = completion.choices[0].message.content;
    const variant = Math.random() < 0.5 ? 'A' : 'B';

    // Salveaza in DB
    await supabase.from('vizite').insert({
      client_id: clientId,
      product_id: productId,
      varianta_afisata: variant,
      tip_eveniment: 'view'
    });

    res.status(200).json({
      success: true,
      variantShown: variant,
      variantA: originalText,
      variantB: aiVariant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}