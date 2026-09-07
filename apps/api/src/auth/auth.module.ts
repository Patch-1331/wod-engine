import { Global, Module } from '@nestjs/common';
import { UserProvisioningService } from './user-provisioning.service';

@Global()
@Module({
  providers: [UserProvisioningService],
  exports: [UserProvisioningService],
})
export class AuthModule {}
