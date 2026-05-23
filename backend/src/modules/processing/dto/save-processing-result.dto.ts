import { FileStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProcessedSalesRecordDto {
  @IsString()
  @IsNotEmpty()
  saleDate: string;

  @IsEmail()
  customerEmail: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  product: string;
}

export class ProcessingErrorDto {
  @IsInt()
  @Min(1)
  rowNumber: number;

  @IsString()
  @IsOptional()
  columnName?: string | null;

  @IsString()
  @IsNotEmpty()
  errorMessage: string;
}

export class SaveProcessingResultDto {
  @IsEnum(FileStatus)
  status: FileStatus;

  @IsInt()
  @Min(0)
  totalRows: number;

  @IsInt()
  @Min(0)
  validRows: number;

  @IsInt()
  @Min(0)
  invalidRows: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessedSalesRecordDto)
  salesRecords: ProcessedSalesRecordDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessingErrorDto)
  errors: ProcessingErrorDto[];
}
