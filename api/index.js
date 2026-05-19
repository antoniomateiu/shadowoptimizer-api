const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const cors = require('cors');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

const corsHandler = cors({ origin: '*' });

module.exports = (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method === 'POST' && req.url === '/api/optimize') {
        const { clientId, productId, originalText } = req.body;

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

        // Decide aleator: 50% A, 50% B
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
      } else if (req.method === 'POST' && req.url === '/api/track-event') {
        const { clientId, productId, eventType, variant } = req.body;

        await supabase.from('vizite').insert({
          client_id: clientId,
          product_id: productId,
          tip_eveniment: eventType,
          varianta_afisata: variant
        });

        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
};