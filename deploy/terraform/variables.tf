locals {
  main_zone = "ru-central1-b"
}

variable "iam_token" {
  type = string
  sensitive = true
}

variable "gigachat_api_key" {
  type = string
  sensitive = true
}

variable "minio_password" {
  type = string
  sensitive = true
}

variable "user_id" {
  type = string
}

variable "cloud_id" {
  type = string
}

variable "folder_id" {
  type = string
}

variable "backend_image_tag" {
  type = string
}

variable "frontend_image_tag" {
  type = string
}

variable "ssh_pub" {
  type = string
}
