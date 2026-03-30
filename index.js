const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const { createClient } = require('@supabase/supabase-js');

const fetch = global.fetch;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 SUPABASE
const supabase = createClient(
  'https://bkwudpiemnzisfcigeku.supabase.co',
  process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrd3VkcGllbW56aXNmY2lxZWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDM3MzYsImV4cCI6MjA1NTk3OTczNn0.EqHiKxVv3IRR76jsNC1ozuwuT3bj1kxWjuePLNgKE14
);

// 🔐 FIREBASE
const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

// 🔄 TOKEN FIREBASE
async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// 🚀 ENVIO PUSH (FCM V1)
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
    console.error("🔥 ERRO NO PUSH:", error.message);
  }
}

// =============================
// 🔥 TESTE INDIVIDUAL
// =============================
app.get('/teste-push', async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) return res.send("Passe o token na URL");

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
      .from('Usuario') // ✅ corrigido aqui
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
// 🔥 PUSH DINÂMICO (VIEW)
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
      .from('Usuario') // ✅ corrigido aqui também
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    console.log(`🚀 Enviando para ${usuarios.length} usuários`);

    for (const user of usuarios) {
      await sendPushFCM(
        user.fcm_token,
        mensagem.titulo,
        mensagem.mensagem,
        mensagem.tipo,
        mensagem.imagem_url
      );
    }

    // 👉 MANTIVE COMO OPCIONAL (igual você comentou)
    // await supabase
    //   .from('push_messages')
    //   .update({ ativo: false })
    //   .eq('id', mensagem.id);

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
  console.log(`Rodando na porta ${PORT}`);
});