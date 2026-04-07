import { Request, Response } from 'express';
import { TokenService } from '../services/TokenService';

export class ResourceController {
    private tokenService: TokenService;

    constructor(tokenService: TokenService) {
        this.tokenService = tokenService;
    }

    public getProtectedData(req: Request, res: Response): void {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const tokenDetails = this.tokenService.validateAccessToken(token);

        if (!tokenDetails) {
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
            return;
        }

        res.json({
            message: 'Successfully retrieved protected data from the Resource Server!',
            user: tokenDetails.userId,
            serverTime: new Date().toISOString(),
            confidentialInfo: 'If you can read this, your OAuth 2.0 implementation is 100% working correctly without any external APIs.'
        });
    }
}
