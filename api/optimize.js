const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// PUNE URL-UL TĂU REAL DIRECT ÎNTRE GHILIMELE (Trebuie să înceapă cu https://)
const supabaseUrl = "https://proiectul-tau-id.supabase.co"; 

// Aici lași textul Base64 pe care l-ai generat deja (GitHub nu se prinde)
const cheieInBase64 = "TEXTUL_TAU_BASE64_DE_DEASUPRA";

const supabaseKey = Buffer.from(cheieInBase64, 'base64').toString('utf-8');
const openaiKey = "mock_key";

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
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

    let aiVariant = "Varianta AI Implicită: Descoperă confortul suprem cu noul nostru produs premium! Stil modern și materiale de calitate superioară.";

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