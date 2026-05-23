import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStatus } from '@prisma/client';
import { S3Service } from '../../aws/s3/s3.service';
import { SqsService } from '../../aws/sqs/sqs.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';
import { UpdateFileStatusDto } from './dto/update-file-status.dto';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
    private readonly sqsService: SqsService,
    private readonly configService: ConfigService,
  ) {}
  async create(createFileDto: CreateFileDto, user: AuthenticatedUser) {
    const file = await this.prismaService.file.create({
      data: {
        companyId: user.companyId,
        uploadedById: user.id,
        originalName: createFileDto.originalName,
        s3Key: createFileDto.s3Key,
        status: FileStatus.UPLOADED,
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

    return file;
  }

  async findAll(user: AuthenticatedUser) {
    return this.prismaService.file.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
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
        uploadedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async createPresignedUrl(
    createPresignedUrlDto: CreatePresignedUrlDto,
    user: AuthenticatedUser,
  ) {
    const file = await this.prismaService.file.create({
      data: {
        companyId: user.companyId,
        uploadedById: user.id,
        originalName: createPresignedUrlDto.originalName,
        status: FileStatus.UPLOADED,
      },
      select: {
        id: true,
        originalName: true,
        s3Key: true,
        status: true,
        companyId: true,
        uploadedById: true,
        createdAt: true,
      },
    });

    const safeOriginalName = createPresignedUrlDto.originalName.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );

    const s3Key = `raw/${user.companyId}/${file.id}/${safeOriginalName}`;

    const uploadUrl = await this.s3Service.createPresignedUploadUrl({
      key: s3Key,
      contentType: createPresignedUrlDto.contentType,
    });

    const updatedFile = await this.prismaService.file.update({
      where: {
        id: file.id,
      },
      data: {
        s3Key: s3Key,
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

    const bucketName = this.configService.get<string>('awsS3BucketName');

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not defined');
    }

    const queueMessage = await this.sqsService.sendFileProcessingMessage({
      fileId: updatedFile.id,
      companyId: updatedFile.companyId,
      uploadedById: updatedFile.uploadedById,
      bucketName: bucketName,
      s3Key: s3Key,
      originalName: updatedFile.originalName,
      contentType: createPresignedUrlDto.contentType,
    });

    const expiresInSeconds =
      this.configService.get<number>('awsS3PresignedUrlExpiresIn') || 300;

    return {
      file: updatedFile,
      uploadUrl: uploadUrl,
      method: 'PUT',
      expiresInSeconds: expiresInSeconds,
      queueMessage: {
        messageId: queueMessage.messageId,
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: id,
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
        uploadedBy: {
          select: {
            id: true,
            email: true,
          },
        },
        errors: {
          select: {
            id: true,
            rowNumber: true,
            columnName: true,
            errorMessage: true,
            createdAt: true,
          },
          orderBy: {
            rowNumber: 'asc',
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.companyId !== user.companyId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return file;
  }

  async findErrors(id: string, user: AuthenticatedUser) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.companyId !== user.companyId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return this.prismaService.processingError.findMany({
      where: {
        fileId: id,
      },
      orderBy: {
        rowNumber: 'asc',
      },
      select: {
        id: true,
        rowNumber: true,
        columnName: true,
        errorMessage: true,
        createdAt: true,
      },
    });
  }

  async updateStatus(
    id: string,
    updateFileStatusDto: UpdateFileStatusDto,
    user: AuthenticatedUser,
  ) {
    const file = await this.prismaService.file.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.companyId !== user.companyId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    const processedAt =
      updateFileStatusDto.status === FileStatus.PROCESSED ||
      updateFileStatusDto.status === FileStatus.FAILED
        ? new Date()
        : undefined;

    return this.prismaService.file.update({
      where: {
        id: id,
      },
      data: {
        status: updateFileStatusDto.status,
        totalRows: updateFileStatusDto.totalRows,
        validRows: updateFileStatusDto.validRows,
        invalidRows: updateFileStatusDto.invalidRows,
        processedAt: processedAt,
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
      },
    });
  }
}
