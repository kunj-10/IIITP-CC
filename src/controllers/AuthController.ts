import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { ENV } from '../config/env';

export class AuthController {
    private authService: AuthService;
    private tokenService: TokenService;

    constructor(tokenService: TokenService) {
        this.authService = new AuthService();
        this.tokenService = tokenService;
    }

    public authorize(req: Request, res: Response): void {
        const { response_type, client_id, redirect_uri } = req.query;

        if (response_type !== 'code' || client_id !== ENV.CLIENT_ID) {
            res.status(400).send('Invalid authorization request parameters');
            return;
        }

        const sessionUserId = req.cookies.auth_session;
        if (!sessionUserId) {
            res.redirect(`/login.html?redirect_uri=${encodeURIComponent(req.originalUrl)}`);
            return;
        }
        
        const code = this.tokenService.generateAuthCode(client_id as string, redirect_uri as string, sessionUserId);
        res.redirect(`${redirect_uri}?code=${code}`);
    }

    public async login(req: Request, res: Response): Promise<void> {
        const { username, password, original_url } = req.body;

        const user = await this.authService.login(username, password);

        if (user) {
            res.cookie('auth_session', user.username, { httpOnly: true });
            const returnUrl = original_url || '/';
            res.redirect(returnUrl);
        } else {
            res.status(401).send('Invalid credentials. <a href="/login.html">Try again</a>. Hint: admin / password');
        }
    }

    public token(req: Request, res: Response): void {
        const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

        if (grant_type !== 'authorization_code') {
            res.status(400).json({ error: 'unsupported_grant_type' });
            return;
        }

        if (client_id !== ENV.CLIENT_ID || client_secret !== ENV.CLIENT_SECRET) {
            res.status(401).json({ error: 'invalid_client' });
            return;
        }

        const authCodeDetails = this.tokenService.validateAuthCode(code, client_id, redirect_uri);

        if (!authCodeDetails) {
            res.status(400).json({ error: 'invalid_grant' });
            return;
        }

        const accessToken = this.tokenService.generateAccessToken(authCodeDetails.userId);

        res.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ENV.ACCESS_TOKEN_EXPIRATION_S
        });
    }
}
