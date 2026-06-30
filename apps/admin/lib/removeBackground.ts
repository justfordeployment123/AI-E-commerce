import { getToken } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';

export async function removeBackground(imageRef: string, originalName: string): Promise<File> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/uploads/remove-background`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ imageRef }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.error ?? 'Background removal failed');
  }

  const blob = await res.blob();
  const name = originalName.replace(/\.[^.]+$/, '.png');
  return new File([blob], name, { type: 'image/png' });
}
