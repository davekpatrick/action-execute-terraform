# BOF
terraform {
  required_version = "~> 1.3"
  required_providers {
    random = {
      source = "hashicorp/random"
      version = "3.4.3"
    }
    null = {
      source = "hashicorp/null"
      version = "3.2.1"
    }
  }
}
resource "random_pet" "default" {
  length = 2
}
# EOF