const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

let openai = null;
if (openaiKey && openaiKey !== 'mock_key') {
  openai = new OpenAI({ apiKey: openaiKey });
}

module.exports = async function handler(req, res) {
  // Configurare CORS explicită pentru teste locale (Live Server)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control