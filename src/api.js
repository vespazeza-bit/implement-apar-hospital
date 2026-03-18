const BASE = '/api'
const H = { 'Content-Type': 'application/json' }

export const api = {
  get:  (path)       => fetch(`${BASE}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: H, body: JSON.stringify(body) }).then(r => r.json()),
  put:  (path, body) => fetch(`${BASE}${path}`, { method: 'PUT',  headers: H, body: JSON.stringify(body) }).then(r => r.json()),
  del:  (path)       => fetch(`${BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
}