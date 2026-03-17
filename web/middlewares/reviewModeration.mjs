import { blacklist } from "../utils/blacklist.mjs";

const MAPA_SIMBOLOS_TEXTO = {
  // Solo símbolos NO numéricos — se aplican siempre
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
  // Dígitos — SOLO se aplican si están mezclados con letras
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
  //     "1d10ta" → "idiota" ✅
  //     "10 de 10" → sin cambio ✅
  //     "m13rda" → "mierda" ✅
  procesado = procesado.replace(
    /([a-z])([34578410])(?=[a-z])|(?<=[a-z])([34578410])([a-z])|([34578410])(?=[a-z]{2,})/g,
    (match) => {
      return match
        .split("")
        .map((c) => MAPA_SIMBOLOS_NUMERICO[c] ?? c)
        .join("");
    },
  );

  // 3. Quitar tildes restantes
  procesado = procesado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 4. Colapsar "p u t a" → "puta" SOLO si son letras sueltas
  procesado = procesado.replace(
    /(?<![a-z])([a-z]\s){2,}[a-z](?![a-z])/g,
    (match) => {
      return match.replace(/\s+/g, "");
    },
  );

  procesado = procesado
    .replace(/\bw[h]?ts[a]?p[p]?\b/g, "whatsapp")
    .replace(/\bw[h]?as[a]?p[p]?\b/g, "whatsapp")
    .replace(/\btlgr[a]?m\b/g, "telegram");

  // 5. Limpieza final
  return procesado
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const PATRONES_CRITICOS = [
  /ojala?\s+(te\s+)?(mueras?|palmes?|revientes?|pudras?)/i,
  /espero\s+(que\s+)?(te\s+)?(mueras?|palmes?)/i,
  /\b(pudrete|muerete)\b/i,
  /\bkys\b/i,
  /\bgo\s+kill\s+yourself\b/i,
  /(gana[r]?|ingresos|sueldo|trabajo|dinero|dolares|euros).*(whatsapp|telegram|escribeme|contactame|perfil|bio)/i,
  /(whatsapp|telegram|contactame).*\d{9,}/i,
];

const PALABRAS_CON_CONTEXTO = ["cancer", "sida", "enfermedad"];

async function checkToxicity(req, res, next) {
  const { comment } = req.body;
  if (!comment) return next();

  const textoLimpio = normalizarParaFiltro(comment);

  const blacklistNormalizada = blacklist
    .map((w) => normalizarParaFiltro(w))
    .filter(Boolean);

  const tieneBlacklist = blacklistNormalizada.some((palabra) => {
    if (!palabra || palabra.length < 3) return false;
    // Palabras cortas o compuestas: boundary estricto
    // Palabras largas (>6 chars): includes() es suficientemente preciso
    if (palabra.length <= 5) {
      const regex = new RegExp(`(?<![a-z])${palabra}(?![a-z])`);
      return regex.test(textoLimpio);
    }
    return textoLimpio.includes(palabra);
  });

  const tienePatronCritico = PATRONES_CRITICOS.some((p) => p.test(textoLimpio));

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
