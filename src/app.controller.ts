import { Controller, Request, Post, Get, Res } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { Public } from './auth/public-route.guard';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}
  
  @Public()
  @Post('auth/login')
  async login(@Request() req, @Res() res) {
    try {
    const response = {};
    const loginUser =  await this.authService.validateUser(req.body.email, req.body.password );
    const { access_token } = await this.authService.login(loginUser);
    response['token'] = access_token;
    response['body'] = loginUser;
    res.send(response);
    return loginUser;
    } catch(err) {
      res.send({
        error: err.message,
        code: 401
      })
    }
  }

  @Public()
  @Post('auth/register')
  async register(@Request() req, @Res() res) {
    try {
      const newUser = await this.authService.register(req.body);
      const response = {};
      const { access_token } = await this.authService.login(newUser);
      response['token'] = access_token;
      response['body'] = newUser;
      res.send(response);
    } catch(err) {
      res.send({
        error: err.message,
        code: 403
      });
    }
  }
  
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
