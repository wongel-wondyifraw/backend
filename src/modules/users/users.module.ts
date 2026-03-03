import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
// Using a basic module structure for Users without a controller since Auth handles endpoints
// Or we can keep UsersController if needed, but for now just exporting the Service.

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
