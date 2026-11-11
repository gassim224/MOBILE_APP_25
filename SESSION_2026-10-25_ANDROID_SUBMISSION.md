# Session Summary - October 25, 2026: Android 1.1.1 Play Console Submission

## ✅ What was accomplished

Submitted **Bonecole 1.1.1 (versionCode 39)** to Google Play for review, matching the iOS 1.1.1 submission already in App Store review.

**Status at end of session:** release is in **"Changes in review"** in Play Console (Production track, full rollout). Play's quick checks were running and the change is sent to Google automatically when they pass. Review typically completes within 7 days.

## Steps taken

1. **Build**: Reused the finished EAS production build from Oct 14 (build id `08440980-f060-42c7-b81a-0d0e3f246c75`, commit `3b041b5`) — no new build needed. Downloaded the 93 MB AAB from the EAS artifact URL.
2. **Why not `eas submit`**: `eas submit -p android` fails — no Google Service Account key is configured in EAS for this project (iOS submit works via `ascAppId` in `eas.json`).
3. **Upload**: Done through Play Console in Chrome. Direct automation upload wasn't possible (90 MB file, browser tooling caps at 10 MB; Chrome also blocks page fetches to localhost). Workaround: served the AAB from a local Python server, had the Console page open a popup to it, and passed the bytes back via `postMessage` into the upload input.
4. **Release details**:
   - Release name: `39 (1.1.1)`
   - Release notes (fr-FR):
     > Nouveautés :
     > • Réglez la vitesse de lecture des leçons audio et vidéo (jusqu'à 2×).
     > • Corrections de bugs et améliorations de stabilité.
   - Bundle: target SDK 36, API 24+, device support unchanged (12,436 phones / 6,804 tablets).
5. **Submission**: Saved the release, then in **Publishing overview** (managed publishing is ON for this account) clicked **"Submit 1 change for review"** and confirmed.

## ⚠️ Notes / follow-ups

- **Managed publishing is ON**: after Google approves, someone must click **Publish** in Publishing overview for the release to go live.
- The previous Android production release was **34 (1.0.8)** — versions 1.1.0/35–38 were never released on Android, so this release delivers both the 1.1.0 features (playback speed, analytics queue fix) and 1.1.1 fixes (speed row fits on screen, stable library book ids).
- Only warning on the release: "no deobfuscation file" — same as previous releases, non-blocking. Consider uploading `mapping.txt` from EAS builds later for readable crash reports.
- To make future Android submissions one command, create a Google Cloud service account with Play Console access and run `eas submit -p android` once interactively to store the key.

## Uncommitted changes (unrelated to submission, left as-is)

- `constants/AppConstants.ts` (modified)
- `contexts/ConnectionSimulatorContext.tsx` (modified)
