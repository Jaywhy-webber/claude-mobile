# Project Context

Claude Mobile — a React Native (Expo) app that lets you send prompts to a
Claude Code session running in your terminal, from your phone.

## What this repo is

A React Native + Expo project, developed via the AFK agent workflow:

- GitHub issues as the work queue (PRD parent issues + sub-issues)
- Claude Code as the implementation agent
- Label-driven GitHub Actions as the orchestration layer

## Core architectural constraints

- **Mobile-first.** The app targets iOS and Android via Expo. Native builds go
  through EAS; CI only runs type-check and unit tests.
- **Terminal bridge.** The app communicates with a Claude Code session running
  locally on a desktop machine. The transport layer (WebSocket, SSH tunnel,
  etc.) is an open architectural decision to be resolved in the first PRD.
- **Boring v1 ships first.** A working prompt → response loop takes priority
  over polish. Design and DX improvements land as iterations.

## Glossary

- **PRD** — Product Requirements Document. A GitHub issue that describes a
  feature at the goal level and gets decomposed into sub-issues.
- **Sub-issue** — A leaf-level implementation task, child of a PRD.
- **AFK agent** — An autonomous Claude Code session triggered by a GitHub
  label, running in GitHub Actions.
- **Transport** — The mechanism by which the mobile app sends prompts and
  receives output from a Claude Code session on the host machine.

## Architecture

See `docs/adr/` for recorded architectural decisions.
