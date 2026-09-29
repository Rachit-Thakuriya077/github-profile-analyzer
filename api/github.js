// api/github.js (Runs securely on Vercel's servers)
export default async function handler(req, res) {
  const { username, endpoint } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Read your SECRET token from Vercel's secure environment
  const token = process.env.GITHUB_TOKEN;

  const targetUrl = endpoint === 'repos'
    ? `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
    : `https://api.github.com/users/${encodeURIComponent(username)}`;

  const headers = { 'User-Agent': 'DevScope-App' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // Attached secretly here
  }

  try {
    const response = await fetch(targetUrl, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
