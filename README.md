# GitHub Actions: Execute Terraform

This GitHub Action used to setup and execute Hashicorp Terraform

## Inputs

## `apiToken`

Required GitHub API token

## Outputs

## `setupVersion`

The Hashicorp Terraform version that has been setup

## Example usage

```yaml
uses: davekpatrick/action-release-version@0.1.0
with:
  apiToken: ${{ secret.GITHUB_TOKEN }}
```