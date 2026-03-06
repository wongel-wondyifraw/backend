// backend/src/members/dto/create-member.dto.ts

import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsDateString,
    IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';

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

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === 'yes') return true;
        if (value === 'false' || value === 'no') return false;
        return value;
    })
    @IsBoolean()
    baptized?: boolean;

    @IsDateString()
    @IsOptional()
    joined_date?: string;

    // --- ADD THESE TO FIX THE 400 ERROR ---

    @IsOptional()
    avatar?: any; // To allow the 'avatar' field from FormData

    @IsOptional()
    document?: any; // To allow the 'document' field from FormData
    
    // Note: We use 'any' because the class-validator doesn't 
    // validate the File object itself here; the Interceptor handles that.
}