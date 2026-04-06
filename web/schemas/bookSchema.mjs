import { z } from "zod";

export const bookSchema = z
  .object({
    // El ID es el "interruptor". Si existe, Zod asume que es una EDICIÓN.
    id: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : String(val),
      z.string().optional(),
    ),

    title: z.string().trim().min(1, "El título es obligatorio"),

    isbn: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().trim().nullable().optional(),
    ),

    price: z.preprocess(
      (val) => (val === "" ? 0 : Number(val)),
      z.number().min(0, "El precio debe ser un número positivo"),
    ),

    stock: z.preprocess(
      (val) => (val === "" ? 0 : parseInt(val, 10)),
      z.number().int().min(0, "El stock no puede ser negativo"),
    ),

    cover: z.string().optional().nullable(),

    releashed_year: z.preprocess(
      (val) => (val === "" || val === null ? null : parseInt(val, 10)),
      z
        .number()
        .int()
        .min(1000, "Año mínimo 1000")
        .max(2100)
        .nullable()
        .optional(),
    ),

    pages: z.preprocess(
      (val) => (val === "" || val === null ? null : parseInt(val, 10)),
      z.number().int().min(1).nullable().optional(),
    ),

    format: z.string().optional().nullable(),
    language: z.string().trim().min(1, "El idioma es obligatorio"),

    publisher_id: z.preprocess(
      (val) => (val === "" ? undefined : parseInt(val, 10)),
      z.number().int({ message: "Debes seleccionar una editorial" }),
    ),

    synopsis: z.string().trim().optional().nullable(),

    // En edición, si no se marcan, llegan como 'undefined' y el controlador NO los enviará a la API
    author_ids: z.preprocess((val) => {
      if (!val || (Array.isArray(val) && val.length === 0) || val === "")
        return undefined;
      const array = Array.isArray(val) ? val : [val];
      return array.filter((id) => id !== "").map((id) => parseInt(id, 10));
    }, z.array(z.number()).optional()),

    genre_ids: z.preprocess((val) => {
      if (!val || (Array.isArray(val) && val.length === 0) || val === "")
        return undefined;
      const array = Array.isArray(val) ? val : [val];
      return array.filter((id) => id !== "").map((id) => parseInt(id, 10));
    }, z.array(z.number()).optional()),
  })
  .superRefine((data, ctx) => {
    // Si el ID existe, es edición. Si es undefined, es creación.
    const isCreation = !data.id;

    if (isCreation) {
      if (!data.author_ids || data.author_ids.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar al menos un autor para el nuevo libro",
          path: ["author_ids"],
        });
      }
      if (!data.genre_ids || data.genre_ids.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar al menos un género para el nuevo libro",
          path: ["genre_ids"],
        });
      }
    }
    // En edición (isCreation === false), no se añaden errores si los IDs son undefined.
  });
