const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = "sb_publishable_bO_P5h_XyqRk3N1zEnVV9w_RcWWy0Iy";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY3lzZWRjd2Vud2treGJ0d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDA1NjUsImV4cCI6MjA5NDMxNjU2NX0.gremnHaGQzuD-TeWHLXbbhEVjXeaG817l0geMy1uMU4";
const openaiKey = "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";

const supabase = createClient(supabaseUrl, supabaseKey);

let openai = null;
if (openaiKey && openaiKey !== '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') {
  openai = new OpenAI({ apiKey: openaiKey });
}

module.exports = async function handler(req, res) {
  // Configurare CORS explicită pentru teste locale
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    let aiVariant = "Varianta AI Implicită: Descoperă confortul suprem cu noul nostru produs premium!";

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Tu esti un copywriter expert. Genereaza o descriere persuasiva, scurta.' },
            { role: 'user', content: `Descrierea originala: "${originalText}"` }
          ],
          max_tokens: 150
        });
        aiVariant = completion.choices[0].message.content;
      } catch (aiError) {
        console.warn('OpenAI error fallback:', aiError.message);
      }
    }

    const variant = Math.random() < 0.5 ? 'A' : 'B';

    const { error: dbError } = await supabase.from('experimente').insert({
      id_client: clientId,
      text_original: originalText,
      text_ai: aiVariant,
      afisari_a: variant === 'A' ? 1 : 0,
      afisari_b: variant === 'B' ? 1 : 0,
      conversii_a: 0,
      conversii_b: 0
    });

    if (dbError) {
      console.error('Supabase Error:', dbError.message);
    }

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
};