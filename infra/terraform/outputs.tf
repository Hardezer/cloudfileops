output "backend_ecr_repository_url" {
  description = "CloudFileOps backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_ecr_repository_arn" {
  description = "CloudFileOps backend ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}

output "files_bucket_name" {
  description = "CloudFileOps S3 files bucket name"
  value       = aws_s3_bucket.files.bucket
}

output "file_processing_queue_url" {
  description = "CloudFileOps file processing SQS queue URL"
  value       = aws_sqs_queue.file_processing_queue.url
}

output "file_processing_queue_arn" {
  description = "CloudFileOps file processing SQS queue ARN"
  value       = aws_sqs_queue.file_processing_queue.arn
}

output "file_processing_dlq_url" {
  description = "CloudFileOps file processing DLQ URL"
  value       = aws_sqs_queue.file_processing_dlq.url
}

output "file_processing_dlq_arn" {
  description = "CloudFileOps file processing DLQ ARN"
  value       = aws_sqs_queue.file_processing_dlq.arn
}