# RunPod proof of use

This folder holds evidence that the project really uses RunPod. It is empty until real runs are added: nothing here is written by hand.

## How to add proof

1. Put a valid key in `.env`: `RUNPOD_API_KEY=rpa_...` (and `RUNPOD_ENDPOINT_ID=...` once the Serverless endpoint exists).
2. Run `node --env-file=.env scripts/runpod_proof.mjs`. It calls RunPod and saves `proof-<time>.md` and `.json` here with request ids, token usage and timings. The key is never saved.
3. Take screenshots from the RunPod console and save them here:
   - `endpoint.png`: Serverless, your endpoint, with its ID and worker status
   - `requests.png`: the endpoint's Requests tab showing completed jobs
   - `training-pod.png`: the Pod page while `runpod/train/train.py` runs, then `training-log.txt` with the printed metrics
   - `billing.png`: the usage or billing page showing credit spent
4. Commit this folder, and copy the same evidence into `submission/SDC2026_TeamName_Runpod_POU.pdf`.

The README section "How We Use RunPod" describes what each piece does.
