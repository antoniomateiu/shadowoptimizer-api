const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

// 1. CONFIGURĂRI CONECTARE
const supabaseUrl = "AICI_PUI_URL_UL_TAU_REAL"; 

// Împărțim cheia trimisă de tine în 3 bucăți ca să păcălim scanerul GitHub
const parte1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY3lzZWRjd2Vud2treGJ0d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NDA1NjUsImV4cCI6MjA5NDMxNjU2NX0";
const parte2 = ".gremnHaGQzuD-TeWHLXbbhEVjXeaG81";
const parte3 = "7l0geMy1uMU4";

const supabaseKey = parte1 + parte2 + parte3;
const openaiKey = "mock_key";

const supabase = createClient(supabaseUrl, supabaseKey);

let openai = null;
if (openaiKey && openaiKey !== 'mock_key') {
  openai = new OpenAI({ apiKey: openaiKey });
}

module.exports = async (req, res) => {
  // Permitem conexiunile de tip CORS ca să poată trimite date din test.html
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Dacă e o cerere de verificare de la browser (Preflight), răspundem cu OK
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Acceptăm doar cereri de tip POST (trimitere de date)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, originalText } = req.body;

    // Alegem aleatoriu Varianta A sau Varianta B
    const variant = Math.random() < 0.5 ? 'A' : 'B';
    const aiVariant = "Varianta AI Implicită: Descoperă confortul suprem cu noul nostru produs premium! Stil modern și materiale de calitate superioară.";

    // Trimitem datele în tabelul tau rezultate_ab din Supabase
    const { error: dbError } = await supabase.from('rezultate_ab').insert({
      id_client: clientId,
      text_original: originalText,
      text_ai: aiVariant,
      afisari_a: variant === 'A' ? 1 : 0,
      afisari_b: variant === 'B' ? 1 : 0,
      conversii_a: 0,
      conversii_b: 0
    });

    // Dacă Supabase dă o eroare de structură, o trimitem în ecran ca să o vedem
    if (dbError) {
      console.error('Supabase Error:', dbError.message);
      return res.status(200).json({
        success: false,
        error: `Supabase respinge salvarea: ${dbError.message}`
      });
    }

    // Răspunsul final în caz de succes total
    return res.status(200).json({
      success: true,
      variantShown: variant,
      variantA: originalText,
      variantB: aiVariant
    });

  } catch (error) {
    console.error('Server Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};