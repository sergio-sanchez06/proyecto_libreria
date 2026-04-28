import { z } from "zod";

export const authorSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  biography: z
    .string()
    .trim()
    .max(3000, "La biografía no puede superar 3000 caracteres")
    .refine(
      (val) => !/<[a-z][\s\S]*>/i.test(val),
      "La biografía no puede contener HTML",
    )
    .optional()
    .nullable(),
  country: z
    .string()
    .trim()
    .optional()
    .nullable(),
  photo_url: z.string().trim().optional().nullable(),
});
