import { z } from "zod";

export const userSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  email: z.string().email("El email es inválido").trim(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .trim()
    .optional(),
  role: z.string().trim().optional().nullable(),
  default_address: z.string().trim(),
  optional_address: z.string().trim().optional().nullable(),
});
