variable "aws_region" {
  description = "AWS region used by CloudFileOps"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cloudfileops"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "default_tags" {
  description = "Default tags for CloudFileOps resources"
  type        = map(string)
  default = {
    Project     = "CloudFileOps"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

variable "files_bucket_name" {
  description = "S3 bucket used to store CloudFileOps files"
  type        = string
  default     = "cloudfileops-hardezer-dev-2026"
}

variable "file_processing_queue_name" {
  description = "SQS queue used for file processing messages"
  type        = string
  default     = "cloudfileops-file-processing-queue"
}

variable "file_processing_dlq_name" {
  description = "SQS dead letter queue used for failed file processing messages"
  type        = string
  default     = "cloudfileops-file-processing-dlq"
}