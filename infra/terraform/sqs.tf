resource "aws_sqs_queue" "file_processing_dlq" {
  name = var.file_processing_dlq_name

  message_retention_seconds = 345600

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_sqs_queue" "file_processing_queue" {
  name = var.file_processing_queue_name

  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.file_processing_dlq.arn
    maxReceiveCount     = 3
  })

  lifecycle {
    prevent_destroy = true
  }
}
