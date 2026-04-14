import { z } from "zod";

export const publisherSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  country: z.string().trim().optional().nullable(),
  descripcion: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  logo_url: z.string().trim().optional().nullable(),
});
