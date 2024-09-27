import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmployerService } from './employer.service';

@ApiTags('Employer')
@Controller('employer')
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}
}
