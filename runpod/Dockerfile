# RunPod Serverless worker for BijakMatch speech-to-text.
# Build and push, then create a Serverless Endpoint from the image (see README, "How We Use RunPod").
#   docker build -t <dockerhub-user>/bijakmatch-stt:1 runpod/
#   docker push <dockerhub-user>/bijakmatch-stt:1
FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the model into the image so a cold start does not wait on the network.
ARG WHISPER_MODEL=large-v3
ENV WHISPER_MODEL=${WHISPER_MODEL}
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODEL}', device='cpu', compute_type='int8')"

COPY handler.py .
CMD ["python", "-u", "handler.py"]
