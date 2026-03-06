import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMinistryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    about?: string;

    @IsString()
    @IsOptional()
    schedule?: string;

    @IsUUID()
    @IsOptional()
    leader_id?: string;
}
