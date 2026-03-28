const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 SUPABASE
const supabase = createClient(
  'https://bkwudpiemnzisfcigeku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd3VkcGllbW56aXNmY2lxZWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDM3MzYsImV4cCI6MjA1NTk3OTczNn0.EqHiKxVv3IRR76jsNC1ozuwuT3bj1kxWjuePLNgKE14'
);

// 🔐 FIREBASE
const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

// 🔄 token firebase
async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// 🚀 envio push
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
          },
          android: {
            priority: "high",
            notification: {
              sound: "default"
            }
          }
        }
      })
    }
  );

  const data = await response.json();
  console.log(data);
}

// 🔥 TESTE COM TOKEN NA URL
app.get('/teste-push', async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.send("Passe o token na URL");
    }

    await sendPushFCM(token, "Teste 🚀", "Funcionou!");

    res.send("Push enviado!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao enviar push");
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
      if (!user.fcm_token) continue;

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