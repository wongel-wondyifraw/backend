// backend/src/members/dto/create-member.dto.ts

import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsDateString,
    IsBoolean,
    IsArray
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
    gender?: string;

    @IsString()
    @IsOptional()
    status?: string;

    /**
     * baptized is sent as a string "yes"/"no" or "true"/"false" via FormData.
     * This @Transform logic converts it to a real Boolean before @IsBoolean checks it.
     */
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

    @IsString()
    @IsOptional()
    telegram_username?: string;

    @IsString()
    @IsOptional()
    member_type?: string;

    @IsString()
    @IsOptional()
    recommendation_letter_url?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === 'yes') return true;
        if (value === 'false' || value === 'no') return false;
        return value;
    })
    @IsBoolean()
    requires_follow_up?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === 'yes') return true;
        if (value === 'false' || value === 'no') return false;
        return value;
    })
    @IsBoolean()
    holy_spirit_baptized?: boolean;

    @IsDateString()
    @IsOptional()
    salvation_date?: string;

    @IsString()
    @IsOptional()
    location_id?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === 'yes') return true;
        if (value === 'false' || value === 'no') return false;
        return value;
    })
    @IsBoolean()
    is_deacon?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    ministry_ids?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    interested_ministries?: string[];
}