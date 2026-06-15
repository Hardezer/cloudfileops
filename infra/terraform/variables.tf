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