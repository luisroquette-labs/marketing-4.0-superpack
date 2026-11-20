# ADR 0001: Offline bundle and installer safety

Status: accepted

## Context

The client kit must work without Git or network access after download. Its installer may run either from a separate checkout or from the workspace that already contains the onboarding skill.

## Decisions

A `v*` release packages the pack and its engines into one ZIP for offline installation. When the wizard source and destination resolve to the same directory, the installer skips replacement. Otherwise it replaces the destination with the source copy.

## Consequences

The ZIP is self-contained. The path check prevents `rm -rf` from deleting the only wizard copy in an in-place bundle. Release engine revisions are currently taken from mutable default branches; issue #2 tracks pinning and recording those revisions so a release can be reproduced.
