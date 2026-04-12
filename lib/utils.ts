import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid()
    ? parsedDate.format("MM/DD/YYYY")
    : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const translateClerkError = (clerkError: any): string => {
  if (!clerkError) return "";

  const code =
    clerkError.code || (clerkError.errors && clerkError.errors[0]?.code);

  const errorMap: Record<string, string> = {
    // --- SIGN UP ERRORS
    form_password_pwned:
      "Esta contraseña ha sido filtrada en internet. Por seguridad, usa otra diferente.",
    form_identifier_exists:
      "Este correo electrónico ya está registrado. Intenta iniciar sesión.",
    form_password_length_too_short:
      "La contraseña debe tener al menos 8 caracteres.",
    form_identifier_format_incorrect: "El formato del correo no es válido.",

    // --- SIGN IN ERRORS
    form_password_incorrect: "La contraseña es incorrecta. Inténtalo de nuevo.",
    form_identifier_not_found:
      "No encontramos ninguna cuenta con este correo electrónico.",
    user_locked:
      "Tu cuenta ha sido bloqueada temporalmente por demasiados intentos fallidos.",
    not_allowed_to_sign_in:
      "No tienes permiso para iniciar sesión en este momento.",

    // --- VERIFICATION ERRORS
    code_invalid:
      "El código es incorrecto. Verifica el correo que te enviamos.",
    code_expired: "El código ha expirado. Por favor, solicita uno nuevo.",

    // --- GENERAL ERRORS ---
    too_many_requests:
      "Demasiados intentos. Por favor, espera un momento e intenta de nuevo.",
    network_error: "Error de conexión. Revisa tu internet.",
  };

  return errorMap[code] || "Ocurrió un error inesperado. Intenta de nuevo.";
};
