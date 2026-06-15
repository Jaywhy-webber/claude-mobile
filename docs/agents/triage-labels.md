# Triage Labels

## Standard triage labels

| Role | Label | Meaning |
|---|---|---|
| `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human` | `ready-for-human` | Requires human implementation |
| `wontfix` | `wontfix` | Will not be actioned |

## Agent state labels

These labels track an issue's position in the AFK-agent workflow:

| Label | Meaning |
|---|---|
| `agent:implement` | Ready for the implement workflow to run. Adding this label fires `agent-implement.yml` or `agent-implement-prd.yml`. |
| `agent:queued` | Ready for agent work, but waiting on declared GitHub blockers. Auto-promotes when blockers clear via `agent-promote-queued.yml`. |
| `agent:in-progress` | An agent run is currently active. Do not mutate labels while this is set. |
| `agent:review` | PR is ready for the automated review workflow (`agent-review.yml`). |
| `agent:blocked` | A run failed or was refused; needs human attention before retry. |
| `agent:to-issues` | PRD is ready to be decomposed into sub-issues (`agent-to-issues-prd.yml`). |
| `agent:update-branch` | PR needs its branch updated / conflicts resolved (`agent-update-branch.yml`). |

## Label setup

Create these labels in your GitHub repo before using the workflows:

```bash
gh label create "agent:implement"    --color "0075ca" --description "Trigger: run implement agent"
gh label create "agent:queued"       --color "e4e669" --description "Waiting on blockers"
gh label create "agent:in-progress"  --color "d93f0b" --description "Agent run active"
gh label create "agent:review"       --color "0075ca" --description "Trigger: run review agent"
gh label create "agent:blocked"      --color "b60205" --description "Needs human attention"
gh label create "agent:to-issues"    --color "0075ca" --description "Trigger: decompose PRD into sub-issues"
gh label create "agent:update-branch" --color "0075ca" --description "Trigger: merge/resolve conflicts"
gh label create "needs-triage"       --color "e4e669" --description "Needs evaluation"
gh label create "ready-for-agent"    --color "0e8a16" --description "Fully specified, agent-ready"
gh label create "ready-for-human"    --color "c2e0c6" --description "Needs human implementation"
```
