import { Injectable, NotFoundException } from '@nestjs/common';
import { FileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SaveProcessingResultDto } from './dto/save-processing-result.dto';

@Injectable()
export class ProcessingService {
  constructor(private readonly prismaService: PrismaService) {}

  async saveProcessingResult(
    fileId: string,
    saveProcessingResultDto: SaveProcessingResultDto,
  ) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: fileId,
      },
      select: {
        id: true,
        companyId: true,
        status: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const finalStatus =
      saveProcessingResultDto.invalidRows > 0
        ? FileStatus.FAILED
        : saveProcessingResultDto.status;

    const result = await this.prismaService.$transaction(async (tx) => {
      await tx.processingError.deleteMany({
        where: {
          fileId: fileId,
        },
      });

      await tx.salesRecord.deleteMany({
        where: {
          fileId: fileId,
        },
      });

      if (saveProcessingResultDto.errors.length > 0) {
        await tx.processingError.createMany({
          data: saveProcessingResultDto.errors.map((error) => ({
            fileId: fileId,
            rowNumber: error.rowNumber,
            columnName: error.columnName || null,
            errorMessage: error.errorMessage,
          })),
        });
      }

      if (saveProcessingResultDto.salesRecords.length > 0) {
        await tx.salesRecord.createMany({
          data: saveProcessingResultDto.salesRecords.map((record) => ({
            fileId: fileId,
            companyId: file.companyId,
            saleDate: new Date(record.saleDate),
            customerEmail: record.customerEmail,
            amount: record.amount,
            product: record.product,
          })),
        });
      }

      const updatedFile = await tx.file.update({
        where: {
          id: fileId,
        },
        data: {
          status: finalStatus,
          totalRows: saveProcessingResultDto.totalRows,
          validRows: saveProcessingResultDto.validRows,
          invalidRows: saveProcessingResultDto.invalidRows,
          processedAt: new Date(),
        },
        select: {
          id: true,
          originalName: true,
          s3Key: true,
          status: true,
          totalRows: true,
          validRows: true,
          invalidRows: true,
          createdAt: true,
          processedAt: true,
          companyId: true,
          uploadedById: true,
        },
      });

      return updatedFile;
    });

    const errorsCount = await this.prismaService.processingError.count({
      where: {
        fileId: fileId,
      },
    });

    const salesRecordsCount = await this.prismaService.salesRecord.count({
      where: {
        fileId: fileId,
      },
    });

    return {
      file: result,
      summary: {
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        errorsSaved: errorsCount,
        salesRecordsSaved: salesRecordsCount,
      },
    };
  }
}
