export const resolveImageUrl = (img?: string): string => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${img.startsWith('/') ? '' : '/'}${img}`;
};
