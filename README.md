# LaunchPad Container Release Repair

LaunchPad announcement service cannot be released locally. Repair the image build, restore access, then correct runtime configuration. Three intentional faults. No cloud deployment, billing, dependencies to install, PR, or video required.

## Service contract

- Application source: `server.js`. Do not edit application code.
- Server listens on `0.0.0.0:8080` inside the container.
- `GET /health`: HTTP 200, `{"status":"ok"}`.
- Configuration variable: **`APP_ENV`**, exact spelling required. Expected release value: **`production`**.
- `GET /config`: HTTP 200, `{"environment":"production"}` when configured correctly; otherwise the fallback is `development`.
- A clean startup log states the interface, port, and environment. Logs remain plain text.

## Preparation

Fork this repo into your own GitHub account and clone your fork. Do not open a solution PR against the upstream repository.

```bash
git clone https://github.com/YOUR-USERNAME/launchpad-container-release-repair.git
cd launchpad-container-release-repair
git switch -c fix/mpa4-release
cp .env.example .env
docker info
```

Required: Git, running Docker Engine, POSIX shell and curl; internet access for the base image. Use a free host port: check `docker ps` and try `curl --max-time 2 http://localhost:8080/health` before creating the container. If another service owns host port 8080, choose another free host port and use it consistently in mappings and requests. Port conflicts on your machine are not planted faults.

## Repair the build

Run this first and capture its error. Use the build log to correct the one wrong Dockerfile source path, then repeat until it builds.

```bash
docker build --progress=plain -t launchpad:mpa4 .
```

Keep this repaired image for the remaining tasks. No additional build changes or application changes are needed.

## Restore access

The supplied initial command contains a port-mapping fault. Run it as supplied first and capture the failed request while the container is running.

```bash
docker run -d --name launchpad-mpa4 --env-file .env -p 127.0.0.1:8080:8081 launchpad:mpa4
docker logs launchpad-mpa4
```

Wait until logs contain the listening message before sending requests. Inspect the complete port chain using:

```bash
docker ps --filter name=launchpad-mpa4
docker port launchpad-mpa4
docker logs launchpad-mpa4
curl --max-time 3 -i http://localhost:8080/health
```

Correct the container side of the mapping to match the service contract. Remove the previous container before running your corrected command:

```bash
docker rm -f launchpad-mpa4
# Run your corrected docker run command here, then wait for the startup log.
curl --max-time 3 -i http://localhost:8080/health
```

A running process does not by itself prove network reachability. Changing EXPOSE alone does not publish or redirect a port.

## Correct configuration

With the mapping fixed, check the current environment:

```bash
curl --max-time 3 -i http://localhost:8080/config
```

Compare the variable name in `.env` with the service contract. Correct the spelling in `.env`, then recreate the container using your corrected run command and **the same image**. Do not rebuild and do not hardcode configuration into the Dockerfile.

```bash
docker rm -f launchpad-mpa4
# Repeat your corrected docker run command, then wait for the startup log.
docker logs launchpad-mpa4
curl --max-time 3 -i http://localhost:8080/config
curl --max-time 3 -i http://localhost:8080/health
docker ps --filter name=launchpad-mpa4
docker inspect --format 'tag={{.Config.Image}} image_id={{.Image}}' launchpad-mpa4
git check-ignore .env
git diff
```

The tag is a readable label and can be overwritten. The image ID identifies the exact local image. Record the image ID before and after the configuration repair to prove the same image was reused. `.env` is ignored by git and excluded from the image. This exercise uses non-secret labels only; do not insert real credentials.

Commit your Dockerfile repair. To make the configuration repair reproducible for reviewers, also correct the corresponding key in `.env.example` and commit it. Push only to your own fork and keep a reproducible repair history.

## Verify release

Keep original failure output, changed lines and successful build/access/configuration checks. Explain each fault's cause. Confirm final running status, clean startup logs, /health HTTP 200, production /config and unchanged image ID across the configuration-only repair. Add three short notes mapping listener, runtime configuration and revision/log/service-URL checks to Cloud Run. This is a written proposal only; do not deploy to cloud or claim observed cloud readiness.

## Cleanup

```bash
docker rm -f launchpad-mpa4
# Optional after finishing all evidence:
docker image rm launchpad:mpa4
```
