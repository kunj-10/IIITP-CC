import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ClientController } from '../controllers/ClientController';
import { ResourceController } from '../controllers/ResourceController';
import { TokenService } from '../services/TokenService';

const router = Router();
const tokenService = new TokenService();

const authController = new AuthController(tokenService);
const clientController = new ClientController();
const resourceController = new ResourceController(tokenService);

router.get('/', clientController.getHome.bind(clientController));
router.get('/auth-start', clientController.startAuth.bind(clientController));
router.get('/callback', clientController.handleCallback.bind(clientController));

router.get('/authorize', authController.authorize.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/token', authController.token.bind(authController));

router.get('/api/protected-data', resourceController.getProtectedData.bind(resourceController));

export default router;
