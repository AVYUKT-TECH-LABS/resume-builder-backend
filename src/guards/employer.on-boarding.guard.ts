import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { EmployerService } from '../employer/employer.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private employerService: EmployerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const data = await this.employerService.findEmployeeByEmail(
      request.employer?.email,
    );

    if (!data.organization_id) {
      throw new ForbiddenException('Kindly complete on-boarding first!');
    }

    return true;
  }
}
