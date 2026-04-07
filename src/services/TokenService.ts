import crypto from 'crypto';
import { ENV } from '../config/env';

export interface AuthCodeDetails {
    clientId: string;
    redirectUri: string;
    userId: string;
}

export interface AccessTokenDetails {
    userId: string;
}

export class TokenService {
    private authCodes = new Map<string, AuthCodeDetails>();
    private accessTokens = new Map<string, AccessTokenDetails>();

    public generateAuthCode(clientId: string, redirectUri: string, userId: string): string {
        const code = crypto.randomBytes(16).toString('hex');
        this.authCodes.set(code, { clientId, redirectUri, userId });
        
        setTimeout(() => this.authCodes.delete(code), ENV.AUTH_CODE_EXPIRATION_MS);
        return code;
    }

    public validateAuthCode(code: string, clientId: string, redirectUri: string): AuthCodeDetails | null {
        const details = this.authCodes.get(code);
        if (!details || details.clientId !== clientId || details.redirectUri !== redirectUri) {
            return null;
        }
        this.authCodes.delete(code);
        return details;
    }

    public generateAccessToken(userId: string): string {
        const token = crypto.randomBytes(32).toString('hex');
        this.accessTokens.set(token, { userId });
        return token;
    }

    public validateAccessToken(token: string): AccessTokenDetails | null {
        return this.accessTokens.get(token) || null;
    }
}
