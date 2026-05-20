import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey || 'mock_key' });

export default async function handler(req, res) {
  // 1. Setăm capetele CORS pentru a permite accesul de pe calculatorul tău local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Răspundem instant la verificarea automată a browserului (Preflight)
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

    // Varianta de rezervă în caz că nu avem încă API Key de la OpenAI configurat
    let aiVariant = "Varianta AI Alternativă: Descoperă confortul suprem cu noul nostru produs premium!";

    if (openaiKey && openaiKey !== 'mock_key') {
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
        console.warn('OpenAI simulare fallback:', aiError.message);
      }
    }

    // Alegem aleatoriu A (original) sau B (AI)
    const variant = Math.random() < 0.5 ? 'A' : 'B';

    // Salvăm direct în tabelul din Supabase
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
      console.error('Eroare Baza de date Supabase:', dbError.message);
    }

    // Răspundem înapoi către test.html
    res.status(200).json({
      success: true,
      variantShown: variant,
      variantA: originalText,
      variantB: aiVariant
    });

  } catch (error) {
    console.error('Eroare Server:', error);
    res.status(500).json({ error: error.message });
  }
}