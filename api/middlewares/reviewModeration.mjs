import axios from "axios";

const MAPA_SIMBOLOS = {
  4: "a",
  "@": "a",
  "&": "a",
  α: "a",
  3: "e",
  "€": "e",
  ε: "e",
  1: "i",
  "!": "i", // ← "|" eliminado (actúa como separador, no homoglifo)
  0: "o",
  ø: "o",
  5: "s",
  $: "s",
  7: "t",
  "+": "t",
  8: "b",
  и: "n",
  ñ: "n",
  "*": "i",
};

function normalizarParaAPI(texto) {
  if (!texto) return "";
  let procesado = texto.toLowerCase();

  // Colapsar separadores tipo "p|u|t|a" ANTES del mapa
  procesado = procesado.replace(/([a-z])[.\-_|\\](?=[a-z])/g, "$1");

  for (const [simbolo, letra] of Object.entries(MAPA_SIMBOLOS)) {
    procesado = procesado.split(simbolo).join(letra);
  }

  return procesado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

const PATRONES_CRITICOS = [
  // Daño físico directo
  /ojala?\s+.*(muer|palm|pudr|revent|mat)/i,
  /espero\s+(que\s+).*(muer|palm|enferme|pilles)/i,
  /\b(pudrete|muerete)\b/i,
  /\bkys\b/i,
  /\bgo\s+kill\s+yourself\b/i,

  // Enfermedades SOLO con intención explícita — nunca solos
  /ojala?\s+.*(cancer|cancro|sida|enferm)/i,
  /espero\s+(que\s+).*(cancer|sida|enferm|pilles)/i,
  /(pilles|tengas|cojas|oye\s+que\s+te\s+de)\s+.*(cancer|sida)/i,
];

async function checkAISightengine(req, res, next) {
  const { comment } = req.body;
  if (!comment || comment.trim() === "") return next();

  const raw = comment.trim();
  const textoLimpio = normalizarParaAPI(raw);

  // Gate 1: patrones locales sobre texto normalizado (gratis, sin cuota)
  if (PATRONES_CRITICOS.some((p) => p.test(textoLimpio))) {
    console.log(`🚫 [LOCAL-API] "${textoLimpio}" (original: "${raw}")`);
    return res.status(400).json({
      error: "El comentario ha sido rechazado por las normas de la comunidad.",
    });
  }

  // Gate 2: Sightengine sobre texto RAW (mejor contexto semántico para la IA)
  try {
    const response = await axios.get(
      "https://api.sightengine.com/1.0/text/check.json",
      {
        params: {
          text: raw,
          lang: "es,en",
          mode: "standard",
          api_user: process.env.SIGHTENGINE_USER,
          api_secret: process.env.SIGHTENGINE_SECRET,
        },
      },
    );

    const m = response.data?.moderation_classes ?? {};

    const scores = {
      insulting: m.insulting ?? 0,
      toxic: m.toxic ?? 0,
      violent: m.violent ?? 0,
      discriminatory: m.discriminatory ?? 0,
      sexual: m.sexual ?? 0,
    };

    console.log(
      `[SE] tox=${scores.toxic.toFixed(2)} ins=${scores.insulting.toFixed(2)} ` +
        `vio=${scores.violent.toFixed(2)} sex=${scores.sexual.toFixed(2)} | "${raw}"`,
    );

    const esOfensivo =
      scores.insulting > 0.35 ||
      scores.toxic > 0.45 ||
      scores.violent > 0.4 ||
      scores.discriminatory > 0.35 ||
      scores.sexual > 0.4;

    if (esOfensivo) {
      console.log(`🚫 [SIGHTENGINE] Bloqueado: "${raw}"`);
      return res.status(400).json({
        error:
          "El comentario ha sido rechazado por las normas de la comunidad.",
      });
    }

    next();
  } catch (error) {
    console.error("⚠️ Sightengine error:", error.message, error.response?.data);
    next();
  }
}

export default { checkAISightengine };
