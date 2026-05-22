import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['text/csv', 'application/vnd.ms-excel'])
  contentType: string;
}
