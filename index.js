app.get('/teste-push', async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.send("Passe o token na URL");
    }

    await sendPushFCM(token, "Teste 🚀", "Funcionou!");

    res.send("Push enviado!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao enviar push");
  }
});