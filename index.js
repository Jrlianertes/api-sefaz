const express = require('express');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// ✅ ROTA PRINCIPAL (teste)
app.get('/', (req, res) => {
  res.json({ status: 'API rodando 🚀' });
});

// ✅ ROTA DE CONSULTA
app.post('/consulta', async (req, res) => {
  const { url } = req.body;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const titulo = await page.title();

    await browser.close();

    res.json({
      success: true,
      titulo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ⚠️ fallback (resolve qualquer erro de rota)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    rota: req.url
  });
});

app.post('/harmonizar', async (req, res) => {
  try {
    const { user_id, prato } = req.body;

    if (!user_id || !prato) {
      return res.status(400).send("Dados incompletos");
    }

    const { data } = await supabase
      .from('lista_adega00')
      .select('produto')
      .eq('usuario', user_id);

    const vinhos = data.map(v => v.produto).join(', ');

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBouXzyBbDMHx6Yk420ZBsDFwa7zZNnOx4',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Qual vinho harmoniza melhor com ${prato} considerando estes vinhos: ${vinhos}?`
                }
              ]
            }
          ]
        })
      }
    );

    const json = await response.json();
    const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.send({ resposta: texto });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});