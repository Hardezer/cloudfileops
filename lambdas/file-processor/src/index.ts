import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { SQSEvent, SQSRecord } from 'aws-lambda';

const s3Client = new S3Client({});

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

type CsvValidationError = {
  rowNumber: number;
  columnName: string | null;
  errorMessage: string;
};

type CsvValidationResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CsvValidationError[];
};

const REQUIRED_COLUMNS = ['sale_date', 'customer_email', 'amount', 'product'];

function parseMessage(record: SQSRecord): FileUploadedMessage {
  return JSON.parse(record.body) as FileUploadedMessage;
}

async function getObjectAsString(bucketName: string, s3Key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('S3 object body is empty');
  }

  return response.Body.transformToString();
}

function splitCsvLine(line: string) {
  return line.split(',').map((value) => value.trim());
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateCsv(csvContent: string): CsvValidationResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const errors: CsvValidationError[] = [];

  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [
        {
          rowNumber: 0,
          columnName: null,
          errorMessage: 'CSV file is empty',
        },
      ],
    };
  }

  const headers = splitCsvLine(lines[0]);

  for (const requiredColumn of REQUIRED_COLUMNS) {
    if (!headers.includes(requiredColumn)) {
      errors.push({
        rowNumber: 1,
        columnName: requiredColumn,
        errorMessage: `Missing required column: ${requiredColumn}`,
      });
    }
  }

  if (errors.length > 0) {
    return {
      totalRows: Math.max(lines.length - 1, 0),
      validRows: 0,
      invalidRows: Math.max(lines.length - 1, 0),
      errors,
    };
  }

  const saleDateIndex = headers.indexOf('sale_date');
  const customerEmailIndex = headers.indexOf('customer_email');
  const amountIndex = headers.indexOf('amount');
  const productIndex = headers.indexOf('product');

  let validRows = 0;
  let invalidRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = splitCsvLine(lines[i]);
    let rowHasError = false;

    if (values.length === 0 || values.every((value) => value === '')) {
      errors.push({
        rowNumber,
        columnName: null,
        errorMessage: 'Empty row',
      });
      invalidRows++;
      continue;
    }

    const saleDate = values[saleDateIndex];
    const customerEmail = values[customerEmailIndex];
    const amount = values[amountIndex];
    const product = values[productIndex];

    if (!saleDate || !isValidDate(saleDate)) {
      errors.push({
        rowNumber,
        columnName: 'sale_date',
        errorMessage: 'Invalid sale date',
      });
      rowHasError = true;
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      errors.push({
        rowNumber,
        columnName: 'customer_email',
        errorMessage: 'Invalid customer email',
      });
      rowHasError = true;
    }

    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount < 0) {
      errors.push({
        rowNumber,
        columnName: 'amount',
        errorMessage: 'Invalid amount',
      });
      rowHasError = true;
    }

    if (!product || product.trim().length === 0) {
      errors.push({
        rowNumber,
        columnName: 'product',
        errorMessage: 'Product is required',
      });
      rowHasError = true;
    }

    if (rowHasError) {
      invalidRows++;
    } else {
      validRows++;
    }
  }

  return {
    totalRows: lines.length - 1,
    validRows,
    invalidRows,
    errors,
  };
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

    const csvContent = await getObjectAsString(
      message.bucketName,
      message.s3Key,
    );

    const validationResult = validateCsv(csvContent);

    console.log('CSV validation result:', {
      fileId: message.fileId,
      originalName: message.originalName,
      totalRows: validationResult.totalRows,
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows,
      errorsCount: validationResult.errors.length,
    });

    if (validationResult.errors.length > 0) {
      console.log('CSV validation errors:', validationResult.errors);
    }

    console.log('Temporary processing completed for:', message.fileId);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Messages processed successfully',
    }),
  };
};