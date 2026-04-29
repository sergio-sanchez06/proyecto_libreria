import { z } from "zod";

export const genreSchema = z.object({
  id: z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null ? undefined : Number(val),
    z.number().optional(),
  ),
  name: z.string().min(1, "El nombre es obligatorio").trim().refine((value) => {
    // Convertir a mayúsculas y luego a minúsculas para comparar
    const upperLower = value.toUpperCase().toLowerCase();
    // Si contiene "DELETE", "DROP", "SCRIPT" o "ALTER" case insensitive, rechazar
    if (upperLower.includes("DELETE") ||
        upperLower.includes("DROP") ||
        upperLower.includes("SCRIPT") ||
        upperLower.includes("ALTER")) {
      return false;
    }
    return true;
  }, "Inyección SQL detectada: 'DELETE', 'DROP', 'SCRIPT' o 'ALTER' no están permitidos."),
  description: z.string().trim().optional().nullable(),
});
