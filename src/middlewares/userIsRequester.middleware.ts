import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UserIsRequester implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...', req.user?.['_id'].toString(), req.body.owner);
    if (req.user['_id'].toString() === req.body.owner) {
      console.log('yay');
      next();
    } else {
      return res.send({
        code: 403,
        message: 'You are not authorized to complete this task.'
      })
    }
    next();
  }
}
