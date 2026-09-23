import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AccessModule } from '../access/access.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        forwardRef(() => AccessModule),
        UploadsModule,
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
