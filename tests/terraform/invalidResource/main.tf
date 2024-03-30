# BOF
terraform {
  required_version = "~> 1.3"
  required_providers {
    random = {
      source = "hashicorp/random"
      version = "3.4.3"
    }
  }
}
resource "random_pet" "default" {
  lengthd = 2
  bad_config = "bad"
}
# EOF
