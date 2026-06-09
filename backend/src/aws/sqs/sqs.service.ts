import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;

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

    this.sqsClient = new SQSClient(clientConfig);
  }

  async sendFileProcessingMessage(params: {
    fileId: string;
    companyId: string;
    uploadedById: string;
    bucketName: string;
    s3Key: string;
    originalName: string;
    contentType: string;
  }) {
    const queueUrl = this.configService.get<string>(
      'awsSqsFileProcessingQueueUrl',
    );

    if (!queueUrl) {
      throw new Error('AWS_SQS_FILE_PROCESSING_QUEUE_URL is not defined');
    }

    const messageBody = {
      eventType: 'FILE_UPLOADED',
      fileId: params.fileId,
      companyId: params.companyId,
      uploadedById: params.uploadedById,
      bucketName: params.bucketName,
      s3Key: params.s3Key,
      originalName: params.originalName,
      contentType: params.contentType,
      createdAt: new Date().toISOString(),
    };

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });

    const result = await this.sqsClient.send(command);

    return {
      messageId: result.MessageId,
      body: messageBody,
    };
  }
}
