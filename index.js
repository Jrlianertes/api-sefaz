const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { createClient } = require('@supabase/supabase-js');

const fetch = global.fetch;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =============================
// 🔑 SUPABASE
// =============================
const supabase = createClient(
  'https://bkwudpiemnzisfciqeku.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

// =============================
// 🔐 FIREBASE (CORRIGIDO)
// =============================
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

  // 🔥 CORREÇÃO DO ERRO JWT
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  console.log("✅ Usando credencial do Render");
} catch (err) {
  console.log("⚠️ Falha na variável do Render, usando arquivo local");
  serviceAccount = require('./service-account.json');
}

const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

// =============================
// 🔄 TOKEN FIREBASE
// =============================
async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// =============================
// 🚀 ENVIO PUSH
// =============================
async function sendPushFCM(tokenUsuario, titulo, mensagem, tipo, imagem) {
  try {
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
              body: mensagem,
              ...(imagem && { image: imagem })
            },
            data: {
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              tipo: tipo || "default"
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

    if (!response.ok) {
      console.log("❌ ERRO FCM:", data);
      return;
    }

    console.log("✅ ENVIADO:", data);

  } catch (error) {
    console.error("🔥 ERRO PUSH:", error.message);
  }
}

// =============================
// 🔥 TESTE INDIVIDUAL
// =============================
app.get('/teste-push', async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) return res.send("Informe o token");

    await sendPushFCM(token, "Teste 🚀", "Funcionou!", "home", null);

    res.send("Push enviado!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro");
  }
});

// =============================
// 🔥 ENVIO PARA TODOS
// =============================
app.get('/send-push-all', async (req, res) => {
  try {
    const { data: usuarios, error } = await supabase
      .from('Usuario')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    if (error) throw error;

    for (const user of usuarios) {
      await sendPushFCM(
        user.fcm_token,
        "Lembrete 🚀",
        "Não esqueça seu cupom!",
        "home",
        null
      );
    }

    res.send(`Push enviado para ${usuarios.length} usuários 🚀`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao enviar");
  }
});

// =============================
// 🔥 PUSH DINÂMICO
// =============================
app.get('/send-dynamic', async (req, res) => {
  try {
    const { data: mensagem, error } = await supabase
      .from('push_messages')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !mensagem) {
      return res.send("Nenhuma mensagem ativa");
    }

    const { data: usuarios } = await supabase
      .from('Usuario')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    for (const user of usuarios) {
      await sendPushFCM(
        user.fcm_token,
        mensagem.titulo,
        mensagem.mensagem,
        mensagem.tipo,
        mensagem.imagem_url
      );
    }

    res.send("Push dinâmico enviado 🚀");

  } catch (err) {
    console.error("🔥 ERRO:", err.message);
    res.status(500).send("Erro ao enviar push");
  }
});

// =============================
// ✅ BASE
// =============================
app.get('/', (req, res) => {
  res.send("API rodando 🚀");
});

// =============================
// 🚀 START
// =============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});