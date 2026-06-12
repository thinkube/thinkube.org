---
title: Image Registry
description: Manage container images in Harbor
---

Thinkube Control provides a web interface for managing your Harbor container registry. The page has two tabs: **Mirrored Images** and **Custom Images**.

## Mirrored Images

View and manage images mirrored from external registries. The table shows:

| Column | Description |
|--------|-------------|
| **Image Name** | The repository path |
| **Tag** | Version tag and digest preview |
| **Category** | system (protected) or user |
| **Description** | Image description |
| **Mirror Date** | When the image was mirrored |
| **Status** | Vulnerability scan results (critical/high counts) |

### Image Categories

- **System** - Platform-required images, protected from deletion
- **User** - Manually added images, can be deleted

### Actions

- **View** - See image details
- **Mark as Base** - Designate as a base image for custom builds
- **Edit Template** - Edit the template for base images
- **Re-mirror** - Update to latest version (user images with `latest` tag)
- **Delete** - Remove image (unprotected user images only)

### Adding Images

Click "Add Image" to mirror a new image from an external registry. The platform supports:
- Docker Hub
- NVIDIA NGC
- Quay.io
- Other OCI-compliant registries

## Custom Images

Build custom Docker images directly in Thinkube Control. Custom images can extend base images and are organized by scope.

### Scopes

| Scope | Description |
|-------|-------------|
| **general** | General purpose images |
| **jupyter** | Jupyter/notebook environments |
| **ml** | Machine learning workloads |
| **webapp** | Web applications |
| **database** | Database containers |
| **devtools** | Development tools |

### Image Status

| Status | Description |
|--------|-------------|
| **pending** | Image created, not yet built |
| **building** | Build in progress |
| **success** | Build completed successfully |
| **failed** | Build failed |

### Creating Custom Images

1. Click "Create Custom Image"
2. Select a base image (from mirrored images marked as base)
3. Configure the image (name, scope, packages)
4. Build the image

### Actions

- **Edit Dockerfile** - Modify the Dockerfile in the web editor
- **Build** - Start a new build
- **View Logs** - See build output (after build completes)
- **Delete** - Remove the custom image definition

### Tree View

Toggle "Tree View" to see the parent-child relationships between images. Extended images are shown nested under their parent base images.

## Statistics

The page displays image counts by category:
- **Total Images** - All images in the registry
- **System Images** - Protected platform images
- **Built Images** - Custom-built images
- **User Images** - Manually added images
