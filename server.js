const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Universal proxy endpoint
app.all('/proxy', async (req, res) => {
    const targetUrl = req.query.u;
    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing target URL (?u=...)' });
    }

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
                // Forward user's real IP if available
                ...(req.headers['x-forwarded-for'] ? { 'X-Forwarded-For': req.headers['x-forwarded-for'] } : {}),
                // Forward content-type for POST requests
                ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
            },
            timeout: 30000,
            validateStatus: () => true, // Allow all status codes
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
