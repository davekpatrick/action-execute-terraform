# BOF
terraform {
  required_version = "~> 1.3"
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.17"
    }
  }
}
resource "random_pet" "default" {
  length = 2
}
# EOF