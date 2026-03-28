const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express(); // 👈 TEM QUE VIR ANTES
app.use(express.json());

// ROTAS AQUI 👇
app.get('/teste-push', (req, res) => {
  res.send("Teste funcionando 🚀");
});

app.get('/send-push-all', (req, res) => {
  res.send("Envio para todos 🚀");
});

app.get('/', (req, res) => {
  res.send("API rodando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});