import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { ExpressRequestInterface } from '@app/types/expressRequest.interface';
import { verify } from 'jsonwebtoken';
import { UserRepository } from '@app/user/repositories/user.repository';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userRepository: UserRepository) {}

  async use(req: ExpressRequestInterface, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decode = verify(token, process.env.JWT_SECRET);
      req.user = await this.userRepository.getById(decode.id);
    } catch (err) {
      req.user = null;
    }

    next();
  }
}
