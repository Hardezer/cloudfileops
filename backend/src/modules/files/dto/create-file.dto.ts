import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsOptional()
  s3Key?: string;
}
