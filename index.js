app.get('/send-dynamic', async (req, res) => {
  try {
    // 🔹 busca mensagem ativa
    const { data: mensagens, error: erroMsg } = await supabase
      .from('push_messages')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (erroMsg) {
      console.log("❌ Erro ao buscar mensagem:", erroMsg);
      return res.send("Erro ao buscar mensagem");
    }

    const mensagem = mensagens?.[0];

    if (!mensagem) {
      return res.send("Nenhuma mensagem ativa");
    }

    // 🔹 busca usuários
    const { data: usuarios, error: erroUsers } = await supabase
      .from('users')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    if (erroUsers) {
      console.log("❌ Erro ao buscar usuários:", erroUsers);
      return res.send("Erro ao buscar usuários");
    }

    if (!usuarios || usuarios.length === 0) {
      return res.send("Nenhum usuário com token");
    }

    console.log(`🚀 Enviando para ${usuarios.length} usuários`);

    // 🔹 envio seguro (não quebra com erro)
    for (const user of usuarios) {
      try {
        if (!user.fcm_token) continue;

        await sendPushFCM(
          user.fcm_token,
          mensagem.titulo,
          mensagem.mensagem,
          mensagem.tipo,
          mensagem.imagem_url
        );

      } catch (err) {
        console.log("❌ Erro no token:", user.fcm_token);
        console.log(err.message);
      }
    }

    // 🔹 desativa mensagem após envio (opcional)
    await supabase
      .from('push_messages')
      .update({ ativo: false })
      .eq('id', mensagem.id);

    res.send("Push dinâmico enviado 🚀");

  } catch (err) {
    console.error("🔥 ERRO GERAL:", err.message);
    res.status(500).send("Erro ao enviar push");
  }
});