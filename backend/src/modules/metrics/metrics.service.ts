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
export class MetricsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFilesMetrics(user: AuthenticatedUser) {
    const [
      totalFiles,
      uploadedFiles,
      processingFiles,
      processedFiles,
      failedFiles,
      rowsAggregation,
    ] = await Promise.all([
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.UPLOADED,
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
          status: FileStatus.PROCESSED,
        },
      }),
      this.prismaService.file.count({
        where: {
          companyId: user.companyId,
          status: FileStatus.FAILED,
        },
      }),
      this.prismaService.file.aggregate({
        where: {
          companyId: user.companyId,
        },
        _sum: {
          totalRows: true,
          validRows: true,
          invalidRows: true,
        },
      }),
    ]);

    return {
      totalFiles: totalFiles,
      byStatus: {
        uploaded: uploadedFiles,
        processing: processingFiles,
        processed: processedFiles,
        failed: failedFiles,
      },
      rows: {
        totalRows: rowsAggregation._sum.totalRows || 0,
        validRows: rowsAggregation._sum.validRows || 0,
        invalidRows: rowsAggregation._sum.invalidRows || 0,
      },
    };
  }

  async getSalesMetrics(user: AuthenticatedUser) {
    const [totalSalesRecords, salesAggregation, firstSale, lastSale] =
      await Promise.all([
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
          _avg: {
            amount: true,
          },
        }),
        this.prismaService.salesRecord.findFirst({
          where: {
            companyId: user.companyId,
          },
          orderBy: {
            saleDate: 'asc',
          },
          select: {
            saleDate: true,
          },
        }),
        this.prismaService.salesRecord.findFirst({
          where: {
            companyId: user.companyId,
          },
          orderBy: {
            saleDate: 'desc',
          },
          select: {
            saleDate: true,
          },
        }),
      ]);

    return {
      totalSalesRecords: totalSalesRecords,
      totalAmount: Number(salesAggregation._sum.amount || 0),
      averageAmount: Number(salesAggregation._avg.amount || 0),
      firstSaleDate: firstSale?.saleDate || null,
      lastSaleDate: lastSale?.saleDate || null,
    };
  }

  async getErrorsMetrics(user: AuthenticatedUser) {
    const totalErrors = await this.prismaService.processingError.count({
      where: {
        file: {
          companyId: user.companyId,
        },
      },
    });

    const errorsByColumn = await this.prismaService.processingError.groupBy({
      by: ['columnName'],
      where: {
        file: {
          companyId: user.companyId,
        },
      },
      _count: {
        columnName: true,
      },
      orderBy: {
        columnName: 'asc',
      },
    });
    const latestErrors = await this.prismaService.processingError.findMany({
      where: {
        file: {
          companyId: user.companyId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        rowNumber: true,
        columnName: true,
        errorMessage: true,
        createdAt: true,
        file: {
          select: {
            id: true,
            originalName: true,
          },
        },
      },
    });

    return {
      totalErrors: totalErrors,
      errorsByColumn: errorsByColumn.map((item) => ({
        columnName: item.columnName || 'general',
        count: item._count.columnName,
      })),
      latestErrors: latestErrors,
    };
  }
}
