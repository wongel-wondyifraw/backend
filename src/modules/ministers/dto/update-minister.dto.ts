import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateMinisterDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;
}
