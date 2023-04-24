import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class StripAndCheckRole implements NestMiddleware {
    constructor(private authService: AuthService, private userService: UserService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization.split(' ')[1]
    const decodedToken = this.authService.decode(token);
    const user = await this.userService.findOne(decodedToken.sub);
    if(user.role !== 'superadmin') {
        return res.send({
            code: 403,
            message: 'You are not authorized to complete this task.'
          })
    }
    next();
  }
}
