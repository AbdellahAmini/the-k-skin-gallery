export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
    });
  } catch {
    throw new Error('La connexion au service est indisponible. Réessayez dans un instant.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(typeof detail === 'string' ? detail :
      Array.isArray(detail) ? detail.map((item) => item.msg).join(' · ') :
      'Une erreur est survenue. Réessayez.');
  }
  return data;
}

export const money = (value = 0) => `${Number(value).toLocaleString('fr-FR')} DH`;

export function slugLabel(slug = '') {
  return slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
