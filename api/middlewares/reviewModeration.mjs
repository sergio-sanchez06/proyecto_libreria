import axios from "axios";

// ─── MAPA DE HOMOGLIFOS ───────────────────────────────────────────────────────
// Convierte caracteres visualmente similares a su letra latina equivalente.
// "|" NO está aquí — se trata como separador en el paso 1 del normalizador.
// Los dígitos se reemplazan siempre porque normalizarParaAPI solo se usa
// en el Gate 1 (local), nunca se envía a Sightengine.
const MAPA_SIMBOLOS = {
  4: "a",
  "@": "a",
  "&": "a",
  α: "a",
  3: "e",
  "€": "e",
  ε: "e",
  1: "i",
  "!": "i",
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

// ─── NORMALIZADOR ─────────────────────────────────────────────────────────────
// Solo se usa en el Gate 1 para resistir evasiones con homoglifos.
// Conserva dígitos (a diferencia del middleware web) para que los
// patrones de teléfono (\d{9}) funcionen sobre el texto normalizado.
function normalizarParaAPI(texto) {
  if (!texto) return "";
  let procesado = texto.toLowerCase();

  // Paso 1: Colapsar separadores ANTES del mapa.
  // "p|u|t|a" → "puta"  (si "|" estuviera en el mapa → "i" primero, error)
  procesado = procesado.replace(/([a-z])[.\-_|\\](?=[a-z])/g, "$1");

  // Paso 2: Sustituir homoglifos y leet.
  // "1d10ta" → "idiota", "c&nc3r" → "cancer"
  for (const [simbolo, letra] of Object.entries(MAPA_SIMBOLOS)) {
    procesado = procesado.split(simbolo).join(letra);
  }

  // Paso 3: Normalizar typos de apps de mensajería usadas en spam.
  // "WhtsApp" / "wasa" / "tlgrm" → forma canónica para que los patrones los pillen.
  procesado = procesado
    .replace(/\bw[h]?ts[a]?p[p]?\b/gi, "whatsapp")
    .replace(/\bw[h]?as[a]?p[p]?\b/gi, "whatsapp")
    .replace(/\btlgr[a]?m\b/gi, "telegram");

  // Paso 4: Quitar tildes restantes. Conservamos dígitos ([^a-z0-9\s])
  // para que \d{9} detecte teléfonos en los patrones locales.
  return procesado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "") // ← 0-9 conservado, diferencia clave vs middleware web
    .trim();
}

// ─── PATRONES CRÍTICOS (Gate 1) ───────────────────────────────────────────────
// Se evalúan sobre texto normalizado — cubren evasiones con homoglifos/leet.
// Bloquean gratis, sin gastar cuota de API.
const PATRONES_CRITICOS = [
  // Deseos de muerte (ES + EN)
  /ojala?\s+.*(muer|palm|pudr|revent|mat)/i,
  /espero\s+(que\s+).*(muer|palm|enferme|pilles)/i,
  /\b(pudrete|muerete)\b/i,
  /\bkys\b/i,
  /\bgo\s+kill\s+yourself\b/i,

  // Enfermedades SOLO con intención explícita — nunca solas.
  // "ojala pilles cancer" → bloqueado ✅  |  "mi madre tuvo cancer" → pasa ✅
  /ojala?\s+.*(cancer|cancro|sida|enferm)/i,
  /espero\s+(que\s+).*(cancer|sida|enferm|pilles)/i,
  /(pilles|tengas|cojas)\s+.*(cancer|sida)/i,

  // Spam de dinero + canal de contacto.
  // "gana dinero por whatsapp", "ingresos diarios contactame"
  // .{0,40} limita el salto entre palabras clave para reducir falsos positivos.
  /(gana[r]?|ingresos?|sueldo|trabajo|dinero|dolares?|euros?).{0,40}(whatsapp|telegram|escribeme|contactame)/i,

  // Canal de contacto + teléfono (dígitos conservados en el normalizador).
  // "contactame por WhtsApp: 600000000" → normaliza → detectado aquí.
  /(whatsapp|telegram|contactame|escribeme).{0,20}\d{9,}/i,

  // Teléfono suelto — inusual en una reseña de libro.
  /\b\d{9}\b/,
  /\b\d{3}[\s.\-]\d{3}[\s.\-]\d{3}\b/,
];

// ─── WHITELIST DE REDES SOCIALES ─────────────────────────────────────────────
// Sightengine marca como spam cualquier mención a Instagram, TikTok, etc.
// pero preguntar "¿dónde está su Instagram?" es legítimo en comentarios de autor.
// Se usa para anular el flag spam cuando la mención es claramente informativa.
const REGEX_REDES_SOCIALES =
  /\b(instagram|twitter|tiktok|youtube|facebook|x\.com|threads)\b/i;

// Palabras que convierten una mención a red social en spam real.
// Si aparecen junto a una red social, el bloqueo se mantiene.
const REGEX_SPAM_CON_RED_SOCIAL = new RegExp(
  [
    "contact", // contactame, contáctenme, contacta
    "escri[bv]", // escribeme, escribid, escribidme
    "gana[r]?", // gana, ganar
    "ingresos?",
    "sueldo",
    "trabajo",
    "dinero",
    "onlyfans",
    "pack",
    "s[ií]gu", // sígueme, síguenos, sígame
    "follow", // follow me, follow us
    "visita", // visita, visitame, visitanos
    "uni[rt]e", // únete, unirte
    "suscri", // suscríbete, suscribirse
    "mira\\s*mi", // mira mi perfil
  ].join("|"),
  "i",
);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
async function checkAISightengine(req, res, next) {
  const { comment } = req.body;
  if (!comment || comment.trim() === "") return next();

  const raw = comment.trim();
  const textoLimpio = normalizarParaAPI(raw);

  // ── GATE 1: Patrones locales ─────────────────────────────────────────────
  // Gratis, sin cuota. Cubre muertes, spam y teléfonos aunque estén ofuscados.
  // "0jala te muer4s" → "ojala te mueras" → bloqueado antes de llamar a la API.
  if (PATRONES_CRITICOS.some((p) => p.test(textoLimpio))) {
    console.log(`🚫 [LOCAL] "${textoLimpio}" (original: "${raw}")`);
    return res.status(400).json({
      error: "El comentario ha sido rechazado por las normas de la comunidad.",
    });
  }

  // ── GATE 2: Sightengine (dos llamadas en paralelo) ───────────────────────
  // Promise.all → latencia total = llamada más lenta, no la suma de ambas.
  //
  // mode=rules → matches exactos: spam, PII, links, dinero, contenido adulto.
  //              No da scores — o hay match o no hay match.
  // mode=ml    → scores 0-1 para categorías semánticas (toxic, insulting...).
  //              No detecta spam ni PII — por eso necesitamos las dos llamadas.
  //
  // Ambas reciben el texto RAW para que la IA tenga contexto lingüístico completo.
  try {
    const [rulesRes, mlRes] = await Promise.all([
      // Llamada 1: mode=rules — spam, PII, links, dinero, contenido adulto
      axios.post(
        "https://api.sightengine.com/1.0/text/check.json",
        new URLSearchParams({
          text: raw,
          lang: "es,en",
          mode: "rules",
          categories: "spam,link,personal,money-transaction,content-trade",
          // Sin opt_countries la API solo busca formatos US/FR/GB por defecto
          // → un móvil español (6XXXXXXXX) no se detecta → tel=false siempre.
          opt_countries: "es,mx,ar,co,cl,pe,us,gb",
          // Paranoid: detecta teléfonos muy ofuscados o con dígitos separados.
          // "6 0 0 - 0 0 0 - 0 0 0" → detectado ✅
          opt_phone: "paranoid",
          api_user: process.env.SIGHTENGINE_USER,
          api_secret: process.env.SIGHTENGINE_SECRET,
        }),
      ),

      // Llamada 2: mode=ml — toxicidad semántica
      axios.post(
        "https://api.sightengine.com/1.0/text/check.json",
        new URLSearchParams({
          text: raw,
          lang: "es,en",
          mode: "ml",
          api_user: process.env.SIGHTENGINE_USER,
          api_secret: process.env.SIGHTENGINE_SECRET,
        }),
      ),
    ]);

    // ── Resultados rules ─────────────────────────────────────────────────
    // matches.length > 0 → Sightengine encontró al menos un caso → bloquear.
    const rules = rulesRes.data;
    const tieneSpam = rules.spam?.matches?.length > 0; // publicidad, MLM
    const tieneLink = rules.link?.matches?.length > 0; // URLs, dominios
    const tienePersonal = rules.personal?.matches?.length > 0; // teléfono, email
    const tieneDinero = rules["money-transaction"]?.matches?.length > 0; // scam de dinero
    const tieneTrade = rules["content-trade"]?.matches?.length > 0; // onlyfans, pack

    // Whitelist: si el único motivo de spam es mencionar una red social
    // en contexto neutro ("¿tiene Instagram?"), anulamos el flag.
    // El bloqueo se mantiene si además hay dinero, contacto sospechoso, etc.
    const esSoloMencionSocial =
      tieneSpam &&
      REGEX_REDES_SOCIALES.test(raw) && // hay mención a red social
      !tieneDinero && // sin promesas de dinero
      !tienePersonal && // sin teléfono ni email
      !REGEX_SPAM_CON_RED_SOCIAL.test(raw); // sin palabras de spam adicionales

    // ── Resultados ml ────────────────────────────────────────────────────
    const m = mlRes.data?.moderation_classes ?? {};
    const insulting = m.insulting ?? 0;
    const toxic = m.toxic ?? 0;
    const violent = m.violent ?? 0;
    const discriminatory = m.discriminatory ?? 0;
    const sexual = m.sexual ?? 0;

    console.log(
      `[SE rules] spam=${tieneSpam}(redSocial=${esSoloMencionSocial}) link=${tieneLink} ` +
        `tel=${tienePersonal} dinero=${tieneDinero} trade=${tieneTrade} | ` +
        `[SE ml] tox=${toxic.toFixed(2)} ins=${insulting.toFixed(2)} ` +
        `vio=${violent.toFixed(2)} sex=${sexual.toFixed(2)} | "${raw}"`,
    );

    // ── Lógica de bloqueo ────────────────────────────────────────────────
    // Una sola condición verdadera es suficiente para bloquear.
    // spam se ignora si es solo una mención social en contexto neutro.
    const esSpamOPII =
      (tieneSpam && !esSoloMencionSocial) || // publicidad, MLM — no mención social inocente
      tieneLink || // enlaces externos
      tienePersonal || // teléfono o email
      tieneDinero || // promesas de dinero
      tieneTrade; // onlyfans, pack, nudes

    const esOfensivo =
      insulting > 0.35 ||
      toxic > 0.45 ||
      violent > 0.4 ||
      discriminatory > 0.35 ||
      sexual > 0.4;

    if (esSpamOPII || esOfensivo) {
      const causa = esSpamOPII ? "SPAM/PII" : "ML";
      console.log(`🚫 [SIGHTENGINE-${causa}] "${raw}"`);
      return res.status(400).json({
        error:
          "El comentario ha sido rechazado por las normas de la comunidad.",
      });
    }

    next();
  } catch (error) {
    // Fail-safe: si la API falla (cuota agotada, timeout, error 5xx)
    // dejamos pasar para no bloquear usuarios legítimos.
    // Cámbialo a res.status(503) si prefieres bloquear ante cualquier fallo.
    console.error("⚠️ Sightengine error:", error.message, error.response?.data);
    next();
  }
}

export default { checkAISightengine };
