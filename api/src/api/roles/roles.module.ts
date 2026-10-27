import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller.js';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';

@Module({
  controllers: [RolesController, PermissionsController],
  providers: [RolesService],
})
export class RolesModule {}
