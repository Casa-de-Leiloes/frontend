const ERROR_MAP: Record<string, string> = {
  // Auth
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN_ROLE: "Você não tem permissão para realizar esta ação.",

  // Bids
  LOT_NOT_LIVE: "Este leilão não está em andamento.",
  LOT_NOT_STARTED: "Este leilão ainda não foi iniciado.",
  BID_TOO_LOW: "Lance inferior ao valor mínimo permitido.",
  ALREADY_LEADING: "Você já está dando o maior lance.",
  INSUFFICIENT_FUNDS: "Saldo insuficiente na carteira.",

  // Lots
  LOT_ALREADY_CLOSED: "Este leilão já foi encerrado.",
  LOT_ALREADY_CANCELLED: "Este leilão foi cancelado.",

  // HTTP status fallbacks
  "HTTP 400": "Dados inválidos. Verifique os campos e tente novamente.",
  "HTTP 401": "Sessão expirada. Faça login novamente.",
  "HTTP 403": "Você não tem permissão para realizar esta ação.",
  "HTTP 404": "Recurso não encontrado.",
  "HTTP 409": "Conflito: este recurso já existe.",
  "HTTP 422": "Dados inválidos. Verifique os campos e tente novamente.",
  "HTTP 429": "Muitas tentativas. Aguarde um momento e tente novamente.",
  "HTTP 500": "Erro interno do servidor. Tente novamente mais tarde.",

  // Better Auth messages
  "Invalid email or password": "Email ou senha inválidos.",
  "Email already in use": "Este email já está cadastrado.",
  "User not found": "Usuário não encontrado.",
  "Password is too short": "A senha deve ter pelo menos 8 caracteres.",
  "Invalid password": "Senha incorreta.",
  "Email is required": "O email é obrigatório.",
  "Password is required": "A senha é obrigatória.",
};

export function translateError(raw: unknown): string {
  if (!raw) return "Ocorreu um erro inesperado.";

  const msg = raw instanceof Error ? raw.message : String(raw);

  // Direct match
  if (ERROR_MAP[msg]) return ERROR_MAP[msg];

  // Partial match (e.g. "LOT_ALREADY_CLOSED" inside a JSON string)
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return value;
  }

  // HTTP status code pattern e.g. "HTTP 403"
  const httpMatch = msg.match(/HTTP (\d+)/);
  if (httpMatch) {
    const fallback = ERROR_MAP[`HTTP ${httpMatch[1]}`];
    if (fallback) return fallback;
  }

  // Unknown — return something safe, not raw English
  return "Ocorreu um erro inesperado. Tente novamente.";
}
