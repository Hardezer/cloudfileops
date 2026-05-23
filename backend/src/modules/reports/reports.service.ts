import { Injectable } from '@nestjs/common';
import { FileStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSummaryReport(user: AuthenticatedUser) {
    const [
      totalFiles,
      processedFiles,
      failedFiles,
      processingFiles,
      uploadedFiles,
      totalErrors,
      totalSalesRecords,
      salesAggregation,
      latestFiles,
    ] = await Promise.all([
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.PROCESSED,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.FAILED,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.PROCESSING,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.UPLOADED,
        },
      }),
      this.prismaService.processingError.count({
        where: {
          file: {
            companyId: user.companyId,
          },
        },
      }),
      this.prismaService.salesRecord.count({
        where: {
          companyId: user.companyId,
        },
      }),
      this.prismaService.salesRecord.aggregate({
        where: {
          companyId: user.companyId,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.file.findMany({
        where: {
          companyId: user.companyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          originalName: true,
          status: true,
          totalRows: true,
          validRows: true,
          invalidRows: true,
          createdAt: true,
          processedAt: true,
        },
      }),
    ]);

    const completedFiles = processedFiles + failedFiles;

    const successRate =
      completedFiles === 0
        ? 0
        : Number(((processedFiles / completedFiles) * 100).toFixed(2));

    const failureRate =
      completedFiles === 0
        ? 0
        : Number(((failedFiles / completedFiles) * 100).toFixed(2));

    return {
      files: {
        total: totalFiles,
        uploaded: uploadedFiles,
        processing: processingFiles,
        processed: processedFiles,
        failed: failedFiles,
        completed: completedFiles,
      },
      sales: {
        totalRecords: totalSalesRecords,
        totalAmount: Number(salesAggregation._sum.amount || 0),
      },
      errors: {
        total: totalErrors,
      },
      rates: {
        successRate: successRate,
        failureRate: failureRate,
      },
      latestFiles: latestFiles,
    };
  }
}
