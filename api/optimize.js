const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Inițializăm OpenAI doar dacă există o cheie validă, altfel punem un obiect simplu ca să nu crăpăm la pornire
let openai = null;
if (openaiKey && openaiKey !== 'mock_key') {
  openai = new OpenAI({ apiKey: openaiKey });
}

module.exports = async function handler(req, res) {
  // Setăm headerele CORS pentru a permite testele de pe calculatorul tău
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Răspundem instant la verificarea automată a browserului (Preflight)
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

    // Text implicit în caz că OpenAI nu este configurat sau dă eroare
    let aiVariant = "Varianta AI Alternativă: Descoperă confortul suprem cu noul nostru produs premium!";

    // Generăm textul cu AI doar dacă avem cheia configurată în Vercel
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Tu esti un copywriter expert. Genereaza o descriere de produs mai persuasiva, scurta, sub 100 de cuvinte.'
            },
            {
              role: 'user',
              content: `Descrierea originala: "${originalText}"`
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

    // Salvăm în baza de date în tabelul experimente
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

    // Trimitem răspunsul înapoi
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