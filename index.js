const express = require('express');
const puppeteer = require('puppeteer');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rodando na porta ${PORT}`);
});