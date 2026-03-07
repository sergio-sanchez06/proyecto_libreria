async function filterUserAgent(req, res, next) {
  const USERAGENTS = [
    "gptbot",
    "chatgpt-user",
    "claudebot",
    "applebot-extended",
    "ccbot",
    "imagesiftbot",
    "perplexitybot",
  ];

  let userAgent = req.get("User-Agent") || "";

  userAgent = userAgent.toLowerCase();

  const isAI = USERAGENTS.some((bot) => userAgent.includes(bot.toLowerCase())); // Filtra en el conjunto de datos

  if (isAI) {
    console.log("IA detectada");
    return res
      .status(403)
      .send("El acceso de la libreria está restringido a las IAs");
  }

  next();
}

export default {
  filterUserAgent,
};
