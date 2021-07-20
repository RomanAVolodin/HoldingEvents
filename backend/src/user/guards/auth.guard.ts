import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExpressRequestInterface } from '@app/types/expressRequest.interface';
import { ROLES_KEY } from '@app/user/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import { ERole } from '@app/user/entity/role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ExpressRequestInterface>();

    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!request.user) {
      throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
    }

    if (!requiredRoles) {
      return true;
    }

    return requiredRoles.includes(request.user.role);
  }
}
