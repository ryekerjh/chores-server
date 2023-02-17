import { User } from '../entities/user.entity';

export class CreateUserDto extends User {
    constructor() {
        super();
        delete this.role;
    }
    password: string;
}
