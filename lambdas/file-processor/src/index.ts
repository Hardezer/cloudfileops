import type { SQSEvent, SQSRecord } from 'aws-lambda';

type FileUploadedMessage = {
  eventType: string;
  fileId: string;
  companyId: string;
  uploadedById: string;
  bucketName: string;
  s3Key: string;
  originalName: string;
  contentType: string;
  createdAt: string;
};

function parseMessage(record: SQSRecord): FileUploadedMessage {
  return JSON.parse(record.body) as FileUploadedMessage;
}

export const handler = async (event: SQSEvent) => {
  console.log('CloudFileOps file processor started');
  console.log('Records received:', event.Records.length);

  for (const record of event.Records) {
    const message = parseMessage(record);

    console.log('Message received from SQS:', {
      eventType: message.eventType,
      fileId: message.fileId,
      companyId: message.companyId,
      uploadedById: message.uploadedById,
      bucketName: message.bucketName,
      s3Key: message.s3Key,
      originalName: message.originalName,
      contentType: message.contentType,
      createdAt: message.createdAt,
    });

    console.log('Temporary processing completed for:', message.fileId);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Messages processed successfully',
    }),
  };
};