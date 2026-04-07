import { Request, Response } from 'express';
import path from 'path';
import { ENV } from '../config/env';

export class ClientController {
    public getHome(req: Request, res: Response): void {
        res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'));
    }

    public startAuth(req: Request, res: Response): void {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const redirectUri = `${protocol}://${host}/callback`;
        
        const authUrl = `/authorize?response_type=code&client_id=${ENV.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        res.redirect(authUrl);
    }

    public async handleCallback(req: Request, res: Response): Promise<void> {
        const code = req.query.code as string;
        
        if (!code) {
            res.status(400).send('Authorization code missing');
            return;
        }

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const redirectUri = `${protocol}://${host}/callback`;

        try {
            const tokenUrl = `${protocol}://${host}/token`;
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code,
                    client_id: ENV.CLIENT_ID,
                    client_secret: ENV.CLIENT_SECRET,
                    redirect_uri: redirectUri
                })
            });
            const data = await response.json();
            
            if (data.access_token) {
                res.cookie('client_access_token', data.access_token);
                res.redirect('/success.html');
            } else {
                res.status(400).json(data);
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Error exchanging token.');
        }
    }
}
