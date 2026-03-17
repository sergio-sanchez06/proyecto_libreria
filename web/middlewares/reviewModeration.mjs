import { blacklist } from "../utils/blacklist.mjs";

// Solo separadores visuales que NO son letras reales
// "|" se saca del mapa y se trata como separador en el colapso
const MAPA_SIMBOLOS = {
  4: "a",
  "@": "a",
  α: "a",
  а: "a",
  "&": "a",
  3: "e",
  "€": "e",
  ε: "e",
  е: "e",
  1: "i",
  "!": "i",
  "¡": "i",
  ι: "i", // ← "|" eliminado del mapa
  0: "o",
  ø: "o",
  θ: "o",
  о: "o",
  μ: "u",
  υ: "u",
  ü: "u",
  û: "u",
  5: "s",
  $: "s",
  "§": "s",
  ś: "s",
  š: "s",
  7: "t",
  "+": "t",
  "†": "t",
  τ: "t",
  8: "b",
  ß: "b",
  в: "b",
  и: "n",
  ñ: "n",
  "*": "i",
};

// Separadores usados para evadir: "p.u.t.a" / "p-u-t-a" / "p|u|t|a" / "p_u_t_a"
// Se tratan ANTES del mapa para no confundirlos con homoglifos
const REGEX_SEPARADORES = /([a-z])[.\-_|\\\/](?=[a-z])/g;

const normalizarParaFiltro = (texto) => {
  if (!texto) return "";

  let procesado = texto.toLowerCase();

  // 1. Colapsar separadores tipo "p-u-t-a" → "puta" ANTES del mapa
  //    Así "|" actúa como separador y no como homoglifo de "i"
  procesado = procesado.replace(REGEX_SEPARADORES, "$1");

  // 2. Reemplazar homoglifos
  for (const [simbolo, letra] of Object.entries(MAPA_SIMBOLOS)) {
    procesado = procesado.split(simbolo).join(letra);
  }

  // 3. Quitar tildes restantes
  procesado = procesado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 4. Colapsar "p u t a" → "puta" SOLO si son letras sueltas (1 char) con espacio
  //    Usa lookahead/lookbehind para no colapsar palabras reales
  //    "p u t a" → "puta" ✅
  //    "a veces"  → "a veces" ✅ (porque "veces" tiene más de 1 char)
  procesado = procesado.replace(
    /(?<!\w)([a-z]) (?=[a-z] (?:[a-z] )*[a-z](?!\w))/g,
    "$1",
  );
  // Limpia el último espacio residual de la cadena colapsada
  procesado = procesado.replace(/(?<!\w)([a-z]) ([a-z])(?!\w)/g, "$1$2");

  // 5. Limpieza final
  return procesado
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Patrones que bloquean siempre, independientemente de la blacklist
const PATRONES_CRITICOS = [
  /ojala?\s+(te\s+)?(mueras?|palmes?|revientes?|pudras?)/i,
  /espero\s+(que\s+)?(te\s+)?(mueras?|palmes?)/i,
  /\b(pudrete|muerete)\b/i,
  /\bkys\b/i,
  /\bgo\s+kill\s+yourself\b/i,
];

// Palabras que solo bloquean si van acompañadas de intención explícita
const PALABRAS_CON_CONTEXTO = ["cancer", "sida", "enfermedad"];

async function checkToxicity(req, res, next) {
  const { comment } = req.body;
  if (!comment) return next();

  const textoLimpio = normalizarParaFiltro(comment);

  // 1. Blacklist
  const blacklistNormalizada = blacklist
    .map((w) => normalizarParaFiltro(w))
    .filter(Boolean);

  const tieneBlacklist = blacklistNormalizada.some((palabra) =>
    textoLimpio.includes(palabra),
  );

  // 2. Patrones críticos
  const tienePatronCritico = PATRONES_CRITICOS.some((p) => p.test(textoLimpio));

  // 3. Ataque de salud con intención
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
