import validator from "validator";

export const validateSchema =
  (schema, getExtraDataFn) => async (req, res, next) => {
    if (req.params.id && !req.body.id) req.body.id = req.params.id;

    // Solo trim — sin escape() para no corromper datos legítimos
    // EJS auto-escapa con <%= %> y Zod valida la estructura
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === "string") {
          req.body[key] = req.body[key].trim();
        }
      }
    }

    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      const view = req.viewToRender || "error";
      let extraData = {};
      if (getExtraDataFn) extraData = await getExtraDataFn(req);

      return res.render(view, {
        ...extraData,
        [req.entityName || "data"]: req.body,
        error: error.errors ? error.errors[0].message : "Error de validación",
      });
    }
  };

// export const validateSchema =
//   (schema, getExtraDataFn) => async (req, res, next) => {
//     // A. Unificación de ID para Ediciones
//     if (req.params.id && !req.body.id) req.body.id = req.params.id;

//     // B. Sanitización Automática (Protección XSS/SQLi Global)
//     if (req.body) {
//       for (const key in req.body) {
//         if (typeof req.body[key] === "string") {
//           // Escapamos caracteres peligrosos y limpiamos espacios
//           req.body[key] = validator.escape(req.body[key].trim());
//         }
//       }
//     }

//     try {
//       // C. Validación de Contrato (Zod)
//       const validatedData = await schema.parseAsync(req.body);
//       req.body = validatedData;
//       next();
//     } catch (error) {
//       // D. Gestión de Errores y Usabilidad (Sticky Forms)
//       const view = req.viewToRender || "error";
//       let extraData = {};
//       if (getExtraDataFn) extraData = await getExtraDataFn(req);

//       // Combinamos datos originales con los enviados para no perder el texto
//       return res.render(view, {
//         ...extraData,
//         [req.entityName || "data"]: req.body,
//         error: error.errors ? error.errors[0].message : "Error de validación",
//       });
//     }
//   };
// export const validateSchema =
//   (schema, getExtraDataFn) => async (req, res, next) => {
//     // REFINAMIENTO: Consolidamos el ID de la URL en el body antes de validar
//     // Esto centraliza la lógica y evita repetir req.body.id = req.params.id en cada ruta
//     if (req.params.id && !req.body.id) {
//       req.body.id = req.params.id;
//     }

//     try {
//       const validatedData = await schema.parseAsync(req.body);
//       req.body = validatedData;
//       next();
//     } catch (error) {
//       const view = req.viewToRender || "error";
//       let extraData = {};
//       if (getExtraDataFn) extraData = await getExtraDataFn(req);

//       // Mezclamos datos para no perder lo que el usuario escribió
//       const mergedData = { ...(extraData.book || {}), ...req.body };

//       return res.render(view, {
//         ...extraData,
//         book: mergedData,
//         error: error.errors ? error.errors[0].message : "Error de validación",
//       });
//     }
//   };
