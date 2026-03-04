import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateMemberDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsOptional()
    middle_name?: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsDateString()
    @IsOptional()
    date_of_birth?: string;

    @IsString()
    @IsOptional()
    marital_status?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
