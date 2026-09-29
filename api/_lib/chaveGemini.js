/** Chave Gemini apenas no servidor (nunca VITE_*). */
export function obterChaveGemini() {
  const envKey = process.env.GEMINI_API_KEY || '';
  if (envKey && envKey !== 'MY_GEMINI_API_KEY' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return null;
}

export function temChaveGemini() {
  return obterChaveGemini() !== null;
}
