import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HEALTH_PATH } from '../../constants/app.constant.js';
import { ApiPublic } from '../../decorators/http.decorators.js';
import { HealthResDto } from './dto/health.res.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@SkipThrottle({ ip: true, user: true })
@Controller(HEALTH_PATH)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiPublic({ type: HealthResDto, summary: 'Trạng thái API và database' })
  getHealth(): Promise<HealthResDto> {
    return this.healthService.getHealth();
  }
}
