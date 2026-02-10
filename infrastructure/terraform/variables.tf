# Variables for NeuroKind Infrastructure

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "neurokind"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "neurokind.app"
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"  # For 50k users
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "RDS max storage for autoscaling"
  type        = number
  default     = 1000
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for high availability"
  type        = bool
  default     = true
}

variable "db_read_replica_count" {
  description = "Number of read replicas"
  type        = number
  default     = 2
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_clusters" {
  description = "Number of Redis clusters"
  type        = number
  default     = 2
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task"
  type        = number
  default     = 1024  # 1 vCPU
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MiB"
  type        = number
  default     = 2048  # 2 GB
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 3
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 20
}

# Auto Scaling Thresholds
variable "cpu_target_threshold" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "memory_target_threshold" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 70
}
