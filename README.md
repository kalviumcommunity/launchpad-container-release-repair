# LaunchPad Container Release Repair

A local Module 4 MPA. Repair the image build, restore access, then correct runtime configuration. Three intentional faults. No cloud deployment, billing, dependencies to install, PR, or video required.

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

Docker must be running before the assessment. Use a free host port: check `docker ps` and try `curl --max-time 2 http://localhost:8080/health` before starting. If another service owns host port 8080, choose another free host port and use it consistently in mappings and requests. Port conflicts on your machine are not planted faults.

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

Commit your Dockerfile repair. To make the configuration repair reproducible for reviewers, also correct the corresponding key in `.env.example` and commit it. Push only to your own fork and include its branch link in the PDF.

## PDF outline

Copy this outline into a document and add evidence as you work. Submit one `MPA4_YourName.pdf` below 2,000,000 bytes. Related checks can share screenshots. No need to screenshot prose notes.

**Name and public fork/branch link**

**Task: Repair the image build**
- Before: failed build.
- Fix: changed Dockerfile line or diff; one-sentence cause.
- After: successful image build.

**Task: Restore container access**
- Before: running container and failed request.
- Diagnose: ports and startup log.
- Fix: corrected run command; one-sentence cause.
- After: health endpoint returns HTTP 200 and expected body.

**Task: Correct configuration and verify the release**
- Before: configuration endpoint returns the fallback; record running image ID.
- Fix: corrected non-secret environment key; one-sentence cause.
- After: production configuration response, final health HTTP 200, clean startup log, running status, tag and unchanged image ID.
- Cloud Run mapping: three short lines explaining port/interface, runtime environment configuration, and revision status/logs/service-URL verification. Written explanation only; no cloud deployment.

Use labelled, readable screenshots from your own terminal. Show actual commands and responses, not reconstructed output. Consult the assessment for marking criteria.

## Cleanup

```bash
docker rm -f launchpad-mpa4
# Optional after finishing all evidence:
docker image rm launchpad:mpa4
```
