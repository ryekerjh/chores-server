import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';


@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(username: string, pass: string | Buffer): Promise<Omit<User, 'password'>> | null {
    try {
    const user = await this.userService.findOneByEmail(username);
    const isMatch = await bcrypt.compare(pass, user?.password);
    if (isMatch) {
      const { password, ...result } = user['_doc'];
      return result;
    }
    return null;
  } catch(err) {
    throw err;
  }
  }

  async login(user: Partial<User>) {
    const payload = { username: user.email, sub: user['_id'].toString() };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(baseData: CreateUserDto) {
    try {
      const saltOrRounds = 10;
      const hash = await bcrypt.hash(baseData.password, saltOrRounds);
      baseData.password = hash;
      baseData.role = 'public';
      const createdUser = await this.userService.create(baseData);
      return createdUser;
    } catch(err) {
      throw err;
    }
  }

  decode (jwtToken: string) {
    return this.jwtService.decode(jwtToken);
  }
}