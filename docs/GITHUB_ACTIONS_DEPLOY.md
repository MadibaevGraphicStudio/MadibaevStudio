# Studio production deployment

The workflow `.github/workflows/deploy-production.yml` runs on pushes to `main` and by manual dispatch from `main`. It installs pinned dependencies, runs lint and TypeScript checks, builds Next.js and the production Dockerfile, then connects to VPS2 over SSH. The VPS script updates the Coolify Dockerfile to the exact commit SHA, deploys it, and waits for Coolify and the public health endpoint. The existing `/app/data` bind mount and production environment variables stay on VPS2.

## One-time GitHub setup

Configure these repository Actions secrets in `MadibaevGraphicStudio/MadibaevStudio`:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS2 address |
| `VPS_PORT` | SSH port (22 unless changed) |
| `VPS_USER` | `studio-deploy` |
| `VPS_SSH_KEY` | Private half of the dedicated Studio deploy key, stored outside the repository |
| `VPS_KNOWN_HOSTS` | Verified ED25519 host key line for VPS2 |

The deploy key and verified host-key line are kept on the administrator's computer, outside this Git repository. Never commit them. The VPS user has sudo access only to `/usr/local/sbin/studio-action-deploy.sh`; Coolify's API token stays root-readable on VPS2.

After the workflow and secrets are installed, disable the old `studio-git-deploy.timer` on VPS2 to prevent a push from being deployed before GitHub Actions checks finish. Verify that the first Actions run succeeds before considering the change complete.

## Status and recovery

- GitHub: repository **Actions → Deploy Studio production**.
- VPS: `systemctl status studio-git-deploy.timer`, `journalctl -u studio-git-deploy.service`, and Coolify deployment history for application `v6fitoubkrjztfx4sghbzhuo`.
- Installed SHA: `/var/lib/madibaev-studio/deploy-state.json`.
- Manual retry: **Run workflow** on `main` or invoke the VPS deploy script with the desired full SHA.
- If a deployment fails, Coolify retains the prior healthy container. Inspect its deployment log and retry only after correcting the cause.
