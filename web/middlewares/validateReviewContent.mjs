import { z } from "zod";
import validator from "validator";

const reviewSchema = z.object({
  // z.coerce convierte "5" → 5 (los formularios HTML envían strings)
  rating: z.coerce
    .number({
      required_error: "La puntuación es obligatoria.",
      invalid_type_error: "La puntuación debe ser un número.",
    })
    .int({ message: "La puntuación debe ser un número entero." })
    .min(1, { message: "La puntuación mínima es 1." })
    .max(5, { message: "La puntuación máxima es 5." }),

  comment: z
    .string({
      required_error: "El comentario es obligatorio.",
      invalid_type_error: "El comentario debe ser texto.",
    })
    .min(3, {
      message: "El comentario es demasiado corto (mínimo 3 caracteres).",
    })
    .max(2000, {
      message: "El comentario es demasiado largo (máximo 2000 caracteres).",
    })
    .refine((val) => !/<[a-z][\s\S]*>/i.test(val), {
      message: "El comentario no puede contener etiquetas HTML.",
    })
    .refine(
      (val) =>
        !validator.isURL(val, {
          require_protocol: false,
          allow_fragments: false,
        }),
      { message: "El comentario no puede contener enlaces." },
    ),

  // Entero positivo — compatible con SERIAL / BIGSERIAL de PostgreSQL
  book_id: z.coerce
    .number({
      required_error: "El ID del libro es obligatorio.",
      invalid_type_error: "El ID del libro debe ser un número.",
    })
    .int({ message: "El ID del libro debe ser un número entero." })
    .positive({ message: "El ID del libro no es válido." }),

  returnTo: z.string().optional(),
});

export function validateReview(req, res, next) {
  const resultado = reviewSchema.safeParse(req.body);

  if (!resultado.success) {
    const errores = resultado.error.issues.map((e) => ({
      campo: e.path.join(".") || "general",
      mensaje: e.message,
    }));

    console.log(`⚠️ [VALIDACIÓN] Body inválido:`, errores);

    return res.status(422).json({
      error: "Los datos enviados no son válidos.",
      detalles: errores,
    });
  }

  req.body = {
    ...resultado.data,
    comment: resultado.data.comment.trim(),
  };

  next();
}
