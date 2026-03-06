import { IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class CreateMinisterDto {
    @IsUUID()
    @IsNotEmpty()
    member_id: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
