export function validateBodyFields(requiredFields) {
  return (req, res, next) => {
    // 1. Log inicial para saber qué estamos validando
    console.log("--------------------------------------------");
    console.log(`🔍 [Validación] Ruta: ${req.originalUrl}`);
    console.log("📦 [Body recibido]:", JSON.stringify(req.body, null, 2));

    const missing = requiredFields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === "",
    );

    if (missing.length > 0) {
      // 2. Log si faltan campos
      console.error("❌ [Error] Faltan campos requeridos:", missing);
      return res.status(400).json({
        error: "Datos incompletos",
        missing,
      });
    }

    // Sanitización básica — trim en strings, rechazar HTML
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        const originalValue = req.body[key];
        req.body[key] = req.body[key].trim();

        // 3. Log opcional para ver el trim si el valor cambió
        if (originalValue !== req.body[key]) {
          console.log(`✂️ [Trim] Campo '${key}' limpiado de espacios.`);
        }

        if (/<[a-z][\s\S]*>/i.test(req.body[key])) {
          // 4. Log si se detecta intento de inyección HTML
          console.warn(`🚫 [Bloqueo HTML] Intento de XSS en campo: ${key}`);
          return res.status(400).json({
            error: `El campo '${key}' contiene contenido no permitido`,
          });
        }
      }
    }

    console.log("✅ [Validación exitosa] Todos los campos correctos.");
    console.log("--------------------------------------------");
    next();
  };
}
