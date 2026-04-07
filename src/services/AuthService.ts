import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    public async login(username: string, password: string): Promise<User | null> {
        return await this.userRepository.findByCredentials(username, password);
    }
}
