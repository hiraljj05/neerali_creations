const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function imageUrl(id) {
  return `${API_URL}/items/${id}/image`;
}

export async function login(password, rememberMe) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, remember_me: rememberMe }),
  });
  if (!res.ok) throw new Error('Incorrect password');
  const data = await res.json();
  return data.token;
}

export async function fetchCategories(size) {
  const params = new URLSearchParams();
  if (size) params.set('size', size);
  const res = await fetch(`${API_URL}/items/categories?${params.toString()}`);
  if (!res.ok) throw new Error('Could not load categories');
  return res.json();
}

export async function fetchItems(token, { size, category }) {
  const params = new URLSearchParams();
  if (size) params.set('size', size);
  if (category) params.set('category', category);
  const res = await fetch(`${API_URL}/items?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Could not load the collection');
  return res.json();
}

export async function uploadItem(token, { size, category, file }) {
  const form = new FormData();
  form.append('category', category);
  if (size) form.append('size', size);
  form.append('file', file);
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Could not add the photo');
  return res.json();
}

export async function uploadItems(token, { size, category, files }, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i += 1) {
    const item = await uploadItem(token, { size, category, file: files[i] });
    results.push(item);
    if (onProgress) onProgress(i + 1, files.length);
  }
  return results;
}

export async function setStock(token, id, inStock) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ in_stock: inStock }),
  });
  if (!res.ok) throw new Error('Could not update stock status');
  return res.json();
}

export async function deleteItem(token, id) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not remove the photo');
}
