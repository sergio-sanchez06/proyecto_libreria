import { blacklist } from "../utils/blacklist.mjs";

const MAPA_SIMBOLOS_TEXTO = {
  "@": "a",
  α: "a",
  а: "a",
  "&": "a",
  "€": "e",
  ε: "e",
  е: "e",
  "!": "i",
  "¡": "i",
  ι: "i",
  ø: "o",
  θ: "o",
  о: "o",
  μ: "u",
  υ: "u",
  ü: "u",
  û: "u",
  $: "s",
  "§": "s",
  ś: "s",
  š: "s",
  "+": "t",
  "†": "t",
  τ: "t",
  ß: "b",
  в: "b",
  и: "n",
  ñ: "n",
  "*": "i",
};

const MAPA_SIMBOLOS_NUMERICO = {
  4: "a",
  3: "e",
  1: "i",
  0: "o",
  5: "s",
  7: "t",
  8: "b",
};

const REGEX_SEPARADORES = /([a-z])[.\-_|\\\/](?=[a-z])/g;

const normalizarParaFiltro = (texto) => {
  if (!texto) return "";

  let procesado = texto.toLowerCase();

  // 1. Colapsar separadores tipo "p-u-t-a" → "puta" ANTES del mapa
  procesado = procesado.replace(REGEX_SEPARADORES, "$1");

  // 2a. Reemplazar símbolos no numéricos — siempre
  for (const [simbolo, letra] of Object.entries(MAPA_SIMBOLOS_TEXTO)) {
    procesado = procesado.split(simbolo).join(letra);
  }

  // 2b. Reemplazar dígitos SOLO si están adyacentes a letras (evasión)
  //     "1d10ta" → "idiota" ✅  |  "10 de 10" → sin cambio ✅
  procesado = procesado.replace(
    /([a-z])([34578410])(?=[a-z])|(?<=[a-z])([34578410])([a-z])|([34578410])(?=[a-z]{2,})/g,
    (match) =>
      match
        .split("")
        .map((c) => MAPA_SIMBOLOS_NUMERICO[c] ?? c)
        .join(""),
  );

  // 3. Quitar tildes restantes
  procesado = procesado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 4. Colapsar "p u t a" → "puta" SOLO si son letras sueltas
  procesado = procesado.replace(
    /(?<![a-z])([a-z]\s){2,}[a-z](?![a-z])/g,
    (match) => match.replace(/\s+/g, ""),
  );

  // 5. Normalizar typos de mensajería
  procesado = procesado
    .replace(/\bw[h]?ts[a]?p[p]?\b/g, "whatsapp")
    .replace(/\bw[h]?as[a]?p[p]?\b/g, "whatsapp")
    .replace(/\btlgr[a]?m\b/g, "telegram");

  // 6. Limpieza final — solo letras y espacios
  return procesado
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const PATRONES_CRITICOS = [
  // Deseos de muerte (ES + EN)
  /ojala?\s+(te\s+)?(mueras?|palmes?|revientes?|pudras?)/i,
  /espero\s+(que\s+)?(te\s+)?(mueras?|palmes?)/i,
  /\b(pudrete|muerete)\b/i,
  /\bkys\b/i,
  /\bgo\s+kill\s+yourself\b/i,

  // Spam de dinero + canal de contacto
  // .{0,40} limita el salto para reducir falsos positivos
  /(gana[r]?|ingresos?|sueldo|trabajo|dinero|dolares?|euros?).{0,40}(whatsapp|telegram|escribeme|contactame|perfil|bio)/i,

  // Canal de contacto + teléfono (teléfono solo con contexto, nunca suelto)
  // Eliminados /\b\d{9}\b/ y /\b\d{3}[\s.\-]\d{3}.../ — causaban falsos positivos
  // con "10 de 10", "página 300", etc. Los teléfonos sueltos los caza Sightengine.
  /(whatsapp|telegram|contactame|escribeme).{0,20}\d{9,}/i,
];

// Palabras que SOLO bloquean con intención explícita de daño
// "mi madre tuvo cancer" → pasa ✅  |  "ojala pilles cancer" → bloqueado ✅
const PALABRAS_CON_CONTEXTO = ["cancer", "sida", "enfermedad"];

async function checkToxicity(req, res, next) {
  const { comment } = req.body;

  // Guard defensivo: corta si no pasó por validateReview
  if (!comment || typeof comment !== "string") return next();
  if (comment.length > 2000) {
    return res.status(400).json({ error: "El comentario es demasiado largo." });
  }

  const textoLimpio = normalizarParaFiltro(comment);

  // ── 1. Blacklist ────────────────────────────────────────────────────────
  // Palabras cortas (≤5 chars): boundary estricto para evitar subcadenas falsas.
  // "rat" no debe pillar "rato", "con" no debe pillar "contar".
  // Palabras largas (>5 chars): includes() es suficientemente preciso.
  const blacklistNormalizada = blacklist
    .map((w) => normalizarParaFiltro(w))
    .filter(Boolean);

  const tieneBlacklist = blacklistNormalizada.some((palabra) => {
    if (!palabra || palabra.length < 3) return false;
    if (palabra.length <= 5) {
      return new RegExp(`(?<![a-z])${palabra}(?![a-z])`).test(textoLimpio);
    }
    return textoLimpio.includes(palabra);
  });

  // ── 2. Patrones críticos ────────────────────────────────────────────────
  const tienePatronCritico = PATRONES_CRITICOS.some((p) => p.test(textoLimpio));

  // ── 3. Ataque de salud con intención explícita ──────────────────────────
  const tieneDeseo = /ojala|espero|pilles|tengas|quiero|mueras/i.test(
    textoLimpio,
  );
  const tieneAtaqueSalud =
    tieneDeseo && PALABRAS_CON_CONTEXTO.some((p) => textoLimpio.includes(p));

  if (tieneBlacklist || tienePatronCritico || tieneAtaqueSalud) {
    console.log(
      `🚫 [LOCAL] blacklist=${tieneBlacklist} patron=${tienePatronCritico} ` +
        `salud=${tieneAtaqueSalud} | "${comment}" → "${textoLimpio}"`,
    );
    return res.status(400).json({
      error: "Tu comentario contiene palabras o comportamientos prohibidos.",
    });
  }

  next();
}

export { checkToxicity };
