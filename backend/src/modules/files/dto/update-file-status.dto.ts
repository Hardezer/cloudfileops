import { FileStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateFileStatusDto {
  @IsEnum(FileStatus)
  status: FileStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalRows?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  validRows?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  invalidRows?: number;
}
