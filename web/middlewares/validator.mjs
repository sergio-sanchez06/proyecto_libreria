export const validateSchema =
  (schema, getExtraDataFn) => async (req, res, next) => {
    // REFINAMIENTO: Consolidamos el ID de la URL en el body antes de validar
    // Esto centraliza la lógica y evita repetir req.body.id = req.params.id en cada ruta
    if (req.params.id && !req.body.id) {
      req.body.id = req.params.id;
    }

    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      const view = req.viewToRender || "error";
      let extraData = {};
      if (getExtraDataFn) extraData = await getExtraDataFn(req);

      // Mezclamos datos para no perder lo que el usuario escribió
      const mergedData = { ...(extraData.book || {}), ...req.body };

      return res.render(view, {
        ...extraData,
        book: mergedData,
        error: error.errors ? error.errors[0].message : "Error de validación",
      });
    }
  };
