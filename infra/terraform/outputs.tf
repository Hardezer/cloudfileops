output "backend_ecr_repository_url" {
  description = "CloudFileOps backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "backend_ecr_repository_arn" {
  description = "CloudFileOps backend ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}
