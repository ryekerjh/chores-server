import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor() {}
}
