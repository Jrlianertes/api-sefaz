const express = require('express');

const app = express();

// RESPONDE QUALQUER ROTA (garantia total)
app.use((req, res) => {
  res.send('API OK 🚀');
});

const PORT = process.env.PORT || 3000;

// IMPORTANTE: sem IP fixo
app.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});