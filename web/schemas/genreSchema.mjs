import { z } from "zod";

export const genreSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  description: z.string().trim().optional().nullable(),
});
