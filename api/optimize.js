module.exports = async function handler(req, res) {
  // CORS super-permisiv pentru test
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Răspuns simplu de confirmare
  res.status(200).json({
    success: true,
    message: "HOUSTON, WE HAVE CONTACT! Serverul funcționează!",
    variantShown: "A (test simulare)",
    variantA: "Simulare Text Original",
    variantB: "Simulare Text AI"
  });
};