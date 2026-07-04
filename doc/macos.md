# Running Duix.Avatar on macOS

Duix.Avatar's desktop client runs natively on macOS (Apple Silicon and Intel).
The AI services (video generation, TTS) are Linux CUDA containers; on a Mac they
can either run locally in CPU mode (slow, for development/evaluation) or on a
remote Linux machine with an NVIDIA GPU (recommended for real use).

## Prerequisites

- Node.js 18+
- ffmpeg — `brew install ffmpeg`
- A Docker runtime with Rosetta-accelerated amd64 emulation (Apple Silicon):
  - [Colima](https://github.com/abiosoft/colima): `colima start --cpu 8 --memory 16 --disk 120 --vm-type=vz --vz-rosetta`
  - or Docker Desktop with *Settings → General → Use Rosetta for x86_64/amd64 emulation* enabled
- ~60 GB free disk for the service images

## 1. Run the desktop client

```bash
npm install
npm run dev
```

App data is stored under `~/duix_avatar_data` (the macOS/Linux equivalent of
`D:\duix_avatar_data` on Windows) and the SQLite database under
`~/Library/Application Support/Duix.Avatar`.

To build a distributable `.dmg`:

```bash
npm run build:mac
```

## 2. Run the AI services

### Option A — locally, CPU mode (slow)

```bash
mkdir -p ~/duix_avatar_data/face2face/temp ~/duix_avatar_data/voice/data/origin_audio
cd deploy
docker compose -f docker-compose-mac.yml up -d
```

The upstream images hardcode CUDA calls (torch and onnxruntime, in compiled
Cython modules), so `docker-compose-mac.yml` mounts
`macos-cpu-shim/sitecustomize.py` into the video-generation container. Python
auto-imports it at startup and it remaps CUDA calls to CPU. The TTS service
supports `--device cpu` natively; the ASR service is required by the TTS
service for voice cloning (it transcribes reference audio via
`ws://duix-avatar-asr:10095`).

Measured on an M-series Mac (Rosetta emulation, 10-core VM):

| Task | Time |
| --- | --- |
| Video generation, 2s clip (1080x1920 source) | ~3 minutes |
| TTS synthesis, one short sentence | ~4 minutes |

This is roughly two orders of magnitude slower than an NVIDIA GPU — fine for
development and evaluation, not for production use.

### Option B — remote NVIDIA GPU host (recommended)

Deploy the services on a Linux machine with an NVIDIA GPU using
`deploy/docker-compose-linux.yml` (see the main README), then point the Mac
client at it:

```bash
DUIX_SERVICE_HOST=<gpu-host-ip> npm run dev
```

Individual endpoints can also be overridden with `DUIX_FACE2FACE_URL` and
`DUIX_TTS_URL`.

## Troubleshooting

- **"ffmpeg not found"** — install via `brew install ffmpeg`. The app looks for
  a bundled binary first (`resources/ffmpeg/darwin-arm64/`), then falls back to
  `/opt/homebrew/bin`, `/usr/local/bin`, and `PATH`.
- **Language** — the UI defaults to Chinese on first launch; switch it from the
  settings dropdown in the top-right corner of the app header.
- **Logs** — main process logs: `~/Library/Logs/Duix.Avatar/main.log`;
  service logs: `docker logs duix-avatar-gen-video` / `docker logs duix-avatar-tts`.
