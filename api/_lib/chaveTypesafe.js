/** Chave TypeSafe / Jev apenas no servidor (nunca VITE_*). */
export function obterChaveTypesafe() {
  const primaria = (process.env.TYPESAFE_APP_API || '').trim();
  if (primaria.length > 0) return primaria;
  const fallback = (process.env.TYPESAFE_API_KEY || '').trim();
  if (fallback.length > 0) return fallback;
  return null;
}

export function temChaveTypesafe() {
  return obterChaveTypesafe() !== null;
}

export function obterBaseUrlTypesafe() {
  const base = (process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai').trim().replace(/\/$/, '');
  return base || 'https://api.typesafe.ai';
}