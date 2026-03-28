const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 SUPABASE
const supabase = createClient(
  'https://bkwudpiemnzisfcigeku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd3VkcGllbW56aXNmY2lxZWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDM3MzYsImV4cCI6MjA1NTk3OTczNn0.EqHiKxVv3IRR76jsNC1ozuwuT3bj1kxWjuePLNgKE14'
);

// 🔑 Firebase (SEGURO)
const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

// 🔄 Token Firebase
async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// 🚀 Enviar push
async function sendPushFCM(tokenUsuario, titulo, mensagem) {
  const accessToken = await getAccessToken();

  const response = await fetch(
    'https://fcm.googleapis.com/v1/projects/controle-solidario-fsk4h0/messages:send',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token: tokenUsuario,
          notification: {
            title: titulo,
            body: mensagem
          }
        }
      })
    }
  );

  const data = await response.json();
  console.log(data);
}

// 🔥 TESTE
app.get('/teste-push', async (req, res) => {
  try {
    const token = "COLOQUE_UM_TOKEN_REAL_AQUI";

    await sendPushFCM(token, "Teste 🚀", "Funcionou!");

    res.send("Push enviado!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro");
  }
});

// 🔥 ENVIO PARA TODOS
app.get('/send-push-all', async (req, res) => {
  try {
    const { data: usuarios } = await supabase
      .from('users')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    for (const user of usuarios) {
      await sendPushFCM(
        user.fcm_token,
        "Lembrete 🚀",
        "Não esqueça seu cupom!"
      );
    }

    res.send("Push enviado para todos 🚀");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao enviar");
  }
});

// raiz
app.get('/', (req, res) => {
  res.send("API rodando 🚀");
});

app.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});