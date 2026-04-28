import { z } from "zod";

export const userSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .trim()
    .max(255, "El nombre no puede superar 255 caracteres")
    .refine(
      (val) => !/<[a-z][\s\S]*>/i.test(val),
      "El nombre no puede contener HTML",
    ),
  email: z
    .string()
    .email("El email es inválido")
    .trim()
    .max(255, "El email no puede superar 255 caracteres")
    .refine(
      (val) => !/<[a-z][\s\S]*>/i.test(val),
      "El email no puede contener HTML",
    ),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .trim()
    .max(255, "La contraseña no puede superar 255 caracteres")
    .refine(
      (val) => !/<[a-z][\s\S]*>/i.test(val),
      "La contraseña no puede contener HTML",
    )
    .optional(),
  role: z.enum(["CLIENT", "ADMIN"]).optional().nullable(),
  default_address: z
    .string()
    .min(1, "Debes introducir una dirección por defecto")
    .trim()
    .max(255, "La dirección por defecto no puede superar 255 caracteres")
    .refine(
      (val) => !/<[a-z][\s\S]*>/i.test(val),
      "La dirección por defecto no puede contener HTML",
    ),
  optional_address: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z
      .string()
      .trim()
      .max(255, "La dirección opcional no puede superar 255 caracteres")
      .refine(
        (val) => !/<[a-z][\s\S]*>/i.test(val),
        "La dirección opcional no puede contener HTML",
      )
      .nullable()
      .optional(),
  ),
});
