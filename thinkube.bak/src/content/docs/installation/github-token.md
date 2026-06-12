---
title: Connect to GitHub
description: How to create a GitHub Personal Access Token for Thinkube templates and container registry
---

Thinkube requires a GitHub Personal Access Token to access templates and use GitHub's container registry. While Gitea is the core of Thinkube's GitOps workflow, GitHub provides essential external services.

## Why GitHub Token is Required

GitHub serves specific purposes in Thinkube's architecture:

- **Template Repository Access**: Thinkube templates are stored on GitHub
- **Container Registry**: GitHub Packages provides free container image storage
- **Template Updates**: Pull the latest template versions from GitHub
- **Public Template Sharing**: Access community templates from GitHub
- **Backup Registry**: Alternative to self-hosted registry if needed

> **Note**: The actual GitOps workflow runs through Gitea (self-hosted), not GitHub. GitHub provides external resources and services.

## How Thinkube Uses Both Git Services

- **Gitea** (Self-hosted): 
  - Core GitOps engine
  - Stores your actual application code
  - Triggers CI/CD pipelines
  - Manages deployments via ArgoCD
  - Complete control and privacy

- **GitHub** (External service):
  - Hosts Thinkube templates
  - Provides container registry (GitHub Packages)
  - Template marketplace for sharing
  - External backup and distribution

## Prerequisites

1. **GitHub Account**: Free account at [github.com](https://github.com)
2. **Organization (Optional)**: You can use your personal account or create an organization

## Step 1: Navigate to Token Settings

1. Log in to [GitHub](https://github.com)
2. Click your profile photo (top right corner)
3. Click **Settings**
4. Scroll down and click **Developer settings** (bottom of left sidebar)
5. Click **Personal access tokens**
6. Click **Tokens (classic)**

> **Note**: We use classic tokens as they're simpler to configure for Thinkube's needs

## Step 2: Generate New Token

1. Click **Generate new token**
2. Click **Generate new token (classic)**
3. You may need to enter your GitHub password

## Step 3: Configure Token

### Token Name
Give your token a descriptive name:
- **Note**: `Thinkube Templates and Registry`

### Expiration
Choose an expiration period:
- **90 days**: For testing
- **1 year**: Recommended for homelab use
- **No expiration**: Most convenient but less secure

> **Tip**: Set a calendar reminder to rotate your token before expiration

### Select Scopes

Check the following permissions:

#### Essential Scopes (Required)

✅ **repo** (Full control of private repositories)
- Access to template repositories
- Clone templates for deployment
- Access private templates you create

✅ **workflow** (Update GitHub Action workflows)
- Some templates may include GitHub Actions
- Allows template workflow updates

✅ **write:packages** (Write packages to GitHub Package Registry)
- Push container images to GitHub Packages
- Free storage for your container images
- Automatically includes `read:packages`

#### Optional Scopes

✅ **delete:packages** (Delete packages from GitHub Package Registry)
- Useful for cleanup of old container images
- Manage storage space

### Minimal Permission Set

At minimum, you need:
- `repo`
- `workflow`
- `write:packages`

## Step 4: Create Token

1. Scroll to the bottom
2. Click **Generate token**
3. **CRITICAL**: Copy the token immediately!
   - GitHub will never show this token again
   - If you lose it, you'll need to create a new one

## Step 5: Test Your Token

Verify your token works:

```bash
curl -H "Authorization: token YOUR_TOKEN_HERE" \
     https://api.github.com/user
```

You should see your GitHub user information in JSON format.

## Step 6: Use in Thinkube Installer

When the installer asks for your GitHub Personal Access Token:

1. **Paste your token** in the field
2. **Enter your GitHub username** or organization name
3. The installer will:
   - Verify token permissions
   - Test access to template repositories
   - Confirm package registry access
   - Store the token in `~/.env` file
4. You'll see green checkmarks for each validated permission

## How Tokens are Stored

The installer saves your tokens in the `~/.env` file on your control node:

```bash
# Location after installation
~/.env

# Contents include
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=yourusername
CLOUDFLARE_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

This file is:
- Created with restricted permissions (600)
- Sourced by Thinkube services
- Used by Ansible playbooks
- Not committed to any repository

> **Note**: Token storage in `.env` may be improved in future versions for enhanced security

## Understanding Token Usage

### What Thinkube Does With Your Token

1. **Accesses Template Repositories**
   - Clones templates from GitHub (e.g., `thinkube/tkt-webapp-vue-fastapi`)
   - Checks for template updates
   - Accesses private templates if you have any

2. **Uses GitHub Container Registry**
   - Pushes built container images to GitHub Packages
   - Pulls base images when needed
   - Manages image versions and tags

3. **Template Instantiation**
   - When you deploy a template, it's cloned from GitHub
   - Processed locally with your parameters
   - Pushed to your Gitea instance (not back to GitHub)

### What Happens in Your GitOps Flow

1. **Select Template** (from GitHub) → 
2. **Process Template** (locally) → 
3. **Push to Gitea** (your instance) → 
4. **Trigger CI/CD** (via Gitea webhooks) → 
5. **Build Container** (in your cluster) → 
6. **Push to Registry** (GitHub Packages) → 
7. **Deploy via ArgoCD** (from Gitea manifests)

Your actual code and deployments stay in Gitea. GitHub provides templates and container storage.

## Troubleshooting

### Token Validation Failed

**Insufficient Permissions**
- Ensure you selected `repo`, `workflow`, and `write:packages`
- Classic tokens work better than fine-grained tokens

**Token Expired**
- Check token expiration date in GitHub settings
- Generate a new token if expired

**Wrong Token Format**
- Classic tokens start with `ghp_`
- Ensure you're using a classic token

### Template Access Issues

**Can't Access Templates**
- Verify `repo` scope is enabled
- Check if template repository is public or private
- For private templates, ensure token has access

### Package Registry Issues

**Can't Push Images**
- Verify `write:packages` scope is enabled
- Check GitHub Packages storage limits
- Ensure organization allows package uploads

## Security Best Practices

1. **Use Minimal Scopes**: Only grant permissions Thinkube needs
2. **Set Expiration**: Use 1-year expiration and rotate annually
3. **Monitor Usage**: Check GitHub security log for token usage
4. **Protect .env File**: Ensure `~/.env` has proper permissions (600)
5. **Separate Concerns**: Your code stays in Gitea, only templates/images use GitHub

## Token Rotation

When your token expires or needs rotation:

1. Generate a new token with same permissions in GitHub
2. Update the `.env` file:
   ```bash
   # Edit the file
   nano ~/.env
   # Update the GITHUB_TOKEN line
   GITHUB_TOKEN=ghp_your_new_token_here
   ```
3. Save and ensure permissions are still restrictive:
   ```bash
   chmod 600 ~/.env
   ```
4. Restart services if needed
5. Revoke the old token in GitHub settings

## Next Steps

With both Cloudflare and GitHub tokens configured:
1. Continue with the Thinkube installation
2. Your tokens will be stored in `~/.env`
3. Services will have valid SSL certificates (via Cloudflare)
4. You can deploy templates from GitHub
5. Container images will be stored in GitHub Packages
6. Your applications will be managed through Gitea

## Additional Resources

- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Understanding Thinkube's GitOps Flow](/learn/devops/)