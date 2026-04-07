const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// === IN-MEMORY DATABASES (for demo) ===
const authCodes = new Map(); // MAP: code -> { clientId, redirectUri, userId }
const accessTokens = new Map(); // MAP: token -> { userId }
const users = { 'admin': 'password' }; // Mock user info
const CLIENT_ID = 'demo-client-app';
const CLIENT_SECRET = 'super-secret-key';

// ============================================
// 1. CLIENT APPLICATION
// ============================================

// App Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initiates the OAuth flow
app.get('/auth-start', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/callback`;
    
    const authUrl = `/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.redirect(authUrl);
});

// Callback to handle the authorization code
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).send('Authorization code missing');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/callback`;

    try {
        const tokenUrl = `${protocol}://${host}/token`;
        // Fetch is natively available in Node js 18+
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: redirectUri
            })
        });
        const data = await response.json();
        
        if (data.access_token) {
            // Give client token
            res.cookie('client_access_token', data.access_token);
            res.redirect('/success.html');
        } else {
            res.status(400).json(data);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error exchanging token. Ensure Node v18+ is used.');
    }
});

// ============================================
// 2. AUTHORIZATION SERVER
// ============================================

app.get('/authorize', (req, res) => {
    const { response_type, client_id, redirect_uri } = req.query;

    if (response_type !== 'code' || client_id !== CLIENT_ID) {
        return res.status(400).send('Invalid authorization request parameters');
    }

    // Ensure user is logged in
    const sessionUserId = req.cookies.auth_session;
    if (!sessionUserId) {
        return res.redirect(`/login.html?redirect_uri=${encodeURIComponent(req.originalUrl)}`);
    }
    
    // Create random Authorization Code
    const code = crypto.randomBytes(16).toString('hex');
    authCodes.set(code, { clientId: client_id, redirectUri: redirect_uri, userId: sessionUserId });
    
    // Code valid for 5 min
    setTimeout(() => authCodes.delete(code), 5 * 60 * 1000);

    // Redirect the user back to the client application
    res.redirect(`${redirect_uri}?code=${code}`);
});

app.post('/login', (req, res) => {
    const { username, password, original_url } = req.body;

    if (users[username] && users[username] === password) {
        // Successful login
        res.cookie('auth_session', username, { httpOnly: true });
        
        const returnUrl = original_url || '/';
        res.redirect(returnUrl);
    } else {
        res.status(401).send('Invalid credentials. <a href="/login.html">Try again</a>. Hint: admin / password');
    }
});

app.post('/token', (req, res) => {
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    if (client_id !== CLIENT_ID || client_secret !== CLIENT_SECRET) {
        return res.status(401).json({ error: 'invalid_client' });
    }

    const authCodeDetails = authCodes.get(code);

    if (!authCodeDetails || authCodeDetails.clientId !== client_id || authCodeDetails.redirectUri !== redirect_uri) {
        return res.status(400).json({ error: 'invalid_grant' });
    }

    // valid!
    authCodes.delete(code); // burn code

    const accessToken = crypto.randomBytes(32).toString('hex');
    accessTokens.set(accessToken, { userId: authCodeDetails.userId });

    res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600 // expires in 1H
    });
});

// ============================================
// 3. RESOURCE SERVER
// ============================================

app.get('/api/protected-data', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const tokenDetails = accessTokens.get(token);

    if (!tokenDetails) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    res.json({
        message: 'Successfully retrieved protected data from the Resource Server!',
        user: tokenDetails.userId,
        serverTime: new Date().toISOString(),
        confidentialInfo: 'If you can read this, your OAuth 2.0 implementation is 100% working correctly without any external APIs.'
    });
});

app.listen(PORT, () => {
    console.log(`OAuth App listening on port ${PORT}`);
});
