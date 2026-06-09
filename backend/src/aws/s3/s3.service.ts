import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('awsRegion');
    const accessKeyId = this.configService.get<string>('awsAccessKeyId');
    const secretAccessKey =
      this.configService.get<string>('awsSecretAccessKey');

    if (!region) {
      throw new Error('AWS_REGION is not defined');
    }

    const clientConfig =
      accessKeyId && secretAccessKey
        ? {
            region: region,
            credentials: {
              accessKeyId: accessKeyId,
              secretAccessKey: secretAccessKey,
            },
          }
        : {
            region: region,
          };

    this.s3Client = new S3Client(clientConfig);
  }

  async createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
  }): Promise<string> {
    const bucketName = this.configService.get<string>('awsS3BucketName');
    const expiresIn =
      this.configService.get<number>('awsS3PresignedUrlExpiresIn') || 300;

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not defined');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: params.key,
      ContentType: params.contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn,
    });
  }
}
