---
title: Cloudflare Token Setup
description: How to create a Cloudflare API token for SSL certificate generation
---

Thinkube requires a Cloudflare API token to automatically generate valid SSL certificates for all your services using Let's Encrypt.

## Why Cloudflare is Required

- **Valid SSL Certificates**: Modern browsers and services require valid SSL certificates
- **Automatic DNS Validation**: Let's Encrypt uses DNS challenges to verify domain ownership
- **Wildcard Certificates**: Enables `*.yourdomain.com` certificates for all services
- **No Port Opening Required**: DNS validation doesn't require opening port 80/443
- **Rate Limit Protection**: Proper DNS validation helps avoid Let's Encrypt rate limits

## Prerequisites

1. **Domain Name**: You must own a domain name (e.g., `example.com`)
2. **Cloudflare Account**: Free account at [cloudflare.com](https://cloudflare.com)
3. **Domain on Cloudflare**: Your domain must be using Cloudflare's nameservers

## Step 1: Add Your Domain to Cloudflare

If you haven't already added your domain to Cloudflare:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Add a Site**
3. Enter your domain name
4. Select the **Free** plan (sufficient for Thinkube)
5. Follow the instructions to update your domain's nameservers
6. Wait for DNS propagation (usually 5-30 minutes)

## Step 2: Create an API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on your profile icon (top right)
3. Select **My Profile**
4. Click on **API Tokens** in the left sidebar
5. Click **Create Token**

## Step 3: Configure Token Permissions

### Use Custom Token Template

1. Click **Create Custom Token**
2. Give your token a name: `Thinkube SSL Certificates`

### Set Permissions

Add the following permission:
- **Zone** → **DNS** → **Edit**

### Set Zone Resources

- **Include** → **Specific zone** → Select your domain (e.g., `example.com`)

### Optional: IP Filtering

For additional security, you can restrict the token to your home IP address:
- **IP Address Filtering** → Add your home/server IP address

### Token Summary

Your token configuration should look like:
- **Token name**: Thinkube SSL Certificates
- **Permissions**: Zone:DNS:Edit
- **Zone Resources**: Include - Specific zone - example.com
- **IP Filtering**: (Optional) Your IP address

## Step 4: Create and Save Token

1. Click **Continue to summary**
2. Review the permissions
3. Click **Create Token**
4. **IMPORTANT**: Copy the token immediately - it won't be shown again!
5. Store it securely (password manager recommended)

## Step 5: Test Your Token

You can verify your token works using curl:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
```

You should see a response with `"status": "active"`.

## Step 6: Use in Thinkube Installer

When the Thinkube installer asks for your Cloudflare API Token:
1. Paste the token you created
2. The installer will verify it has access to your domain
3. The token will be stored in `~/.env` file on your control node
4. You'll see a green checkmark when validated

## How Tokens are Stored

The installer saves your tokens in the `~/.env` file:

```bash
# Location after installation
~/.env

# Contents include
CLOUDFLARE_TOKEN=xxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_EMAIL=your@email.com
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

This file is:
- Created with restricted permissions (600)
- Sourced by Thinkube services for certificate generation
- Used by acme.sh for Let's Encrypt certificates
- Never committed to repositories

> **Note**: Token storage in `.env` may be improved in future versions for enhanced security

## Troubleshooting

### Token Validation Failed
- Ensure the token has DNS Edit permissions
- Verify the domain is active on Cloudflare
- Check that nameservers have propagated

### Rate Limit Issues
- Let's Encrypt allows 5 duplicate certificates per week
- If you hit limits, wait 7 days or use a different subdomain
- Thinkube's certificate management helps minimize rate limit issues

### DNS Propagation
- After adding domain to Cloudflare, wait for propagation
- Use `nslookup yourdomain.com` to verify Cloudflare nameservers
- Typical propagation time: 5-30 minutes, max 48 hours

## Security Best Practices

1. **Minimal Permissions**: Only grant DNS Edit for your specific zone
2. **IP Restrictions**: Add IP filtering if your server has a static IP
3. **Token Rotation**: Rotate tokens periodically
4. **Secure Storage**: Never commit tokens to Git repositories
5. **Monitoring**: Check Cloudflare audit logs periodically

## Next Steps

Once you have your Cloudflare token:
1. Continue with the Thinkube installation
2. The installer will use this token to generate SSL certificates
3. All your services will have valid HTTPS connections
4. Certificates will auto-renew before expiration