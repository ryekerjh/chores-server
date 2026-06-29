import { Controller, Request, Post, Get, Res, Headers } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { Public } from './auth/public-route.guard';
import { AlertService } from './alert/alert.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService, private alertService: AlertService) {}
  
  @Public()
  @Post('auth/login')
  async login(@Request() req, @Res() res, @Headers('x-platform') platform: string) {
    try {
      const response = {};
      const loginUser =  await this.authService.validateUser(req.body.email, req.body.password );
      const { access_token } = await this.authService.login(loginUser);

      if (platform === 'mobile') {
        // Return a different payload for mobile
        response['token'] = access_token;
        response['userId'] = loginUser['_id'];
        response['alerts'] = await this.alertService.findAllByUser(loginUser['_id'] );
      } else {
        // Default payload for browser or other platforms
        response['token'] = access_token;
        response['body'] = loginUser;
      }

      res.send(response);
      return loginUser;
    } catch(err) {
      res.status(401).send({
        error: (err as Error).message,
        code: 401
      });
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
        error: (err as Error).message,
        code: 403
      });
    }
  }
  
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
