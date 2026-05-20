const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey || 'mock_key' }); // fallback ca să nu crape complet dacă lipsește cheia

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight pentru cererile din browser (CORS)
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

    let aiVariant = "Varianta AI Alternativă: Descoperă confortul suprem cu noul nostru produs premium, creat special pentru tine!";

    // Generăm textul cu OpenAI doar dacă avem o cheie validă salvată
    if (openaiKey) {
      try {
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
        aiVariant = completion.choices[0].message.content;
      } catch (aiError) {
        console.warn('OpenAI error, folosim textul fallback:', aiError.message);
      }
    }

    // Alegem aleatoriu Varianta A sau B
    const variant = Math.random() < 0.5 ? 'A' : 'B';

    // Salvează în DB în tabelul corect 'experimente'
    const { error: dbError } = await supabase.from('experimente').insert({
      id_client: clientId, // ID-ul din test.html
      text_original: originalText,
      text_ai: aiVariant,
      afisari_a: variant === 'A' ? 1 : 0,
      afisari_b: variant === 'B' ? 1 : 0,
      conversii_a: 0,
      conversii_b: 0
    });

    if (dbError) {
      console.error('Supabase Error:', dbError);
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
}