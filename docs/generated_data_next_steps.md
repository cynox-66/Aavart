# Generated Data Integration: Next Steps

## Objective

Connect the two generated corridor fixtures to the existing RailNiyojan flow so
the dashboard can show a credible, end-to-end planning demonstration.

All generated records are `CONTROLLED-SCENARIO`. They are not Railway-approved
section mappings, permits, isolation plans, or block authorizations.

## Scope boundary

- Two corridors are available for selection.
- One planning run uses one corridor only.
- RailRadar remains public train-context data.
- CP-SAT may generate candidate recommendations only.
- No generated record may be presented as operational Railway authority.

## Implementation order

### 1. Validate a generated corridor

Use:

```text
fixtures/generated/corridor_1/dataset.json
```

Send it to `POST /datasets/validate` and confirm that a snapshot ID is
returned.

Acceptance:

- Validation succeeds.
- Counts are visible.
- The snapshot is immutable and linked to Corridor 1.
- Provenance remains `CONTROLLED-SCENARIO`.

### 2. Run CP-SAT

Create a planning run from the validated snapshot.

Acceptance:

- The run completes as `FEASIBLE` or `OPTIMAL`.
- Scheduled jobs include section, asset, resource, window, and time.
- Unscheduled jobs include stable reason codes.
- Train paths, section conflicts, resource conflicts, and isolation conflicts
  are respected.

### 3. Add corridor selection

Use:

```text
fixtures/generated/catalog.json
```

The UI should allow the planner to select Corridor 1 or Corridor 2 before
validation. Do not combine both corridor datasets into one planning snapshot.

Acceptance:

- Switching corridors loads the correct dataset.
- Section, job, train, permit, and isolation IDs do not cross corridors.
- The selected corridor is shown in the planning run metadata.

### 4. Display the operational context

Load these records from the selected corridor directory:

- `stations.json`
- `isolation_zones.json`
- `block_rules.json`
- `permits.json`
- `dataset.json`

Show them in the corridor and plan-review views.

Required visible fields:

- Station sequence and section boundaries
- Train paths and timing
- Isolation zone and responsible department
- Block type and required authority
- Permit status and expiry state
- Source class and freshness

### 5. Add data-readiness warnings

The dashboard must visibly warn about:

- `CONTROLLED-SCENARIO` records
- Expired permits
- Unavailable planning windows
- Restricted assets
- Missing or stale mappings
- Candidate recommendation versus authorized block

Warnings must not be hidden behind tooltips or logs.

### 6. Verify the full workflow

Run this sequence:

```text
Select corridor
  -> validate dataset
  -> create planning run
  -> inspect schedule and reasons
  -> lock one scheduled job
  -> re-plan affected work
  -> approve valid run
  -> export recommendation
```

Repeat the same workflow with Corridor 2.

## Acceptance checklist

- [ ] Corridor 1 validates successfully.
- [ ] Corridor 2 validates successfully.
- [ ] Both corridors produce deterministic snapshot IDs.
- [ ] CP-SAT schedules jobs and reports unscheduled reasons.
- [ ] No job references an unknown section, asset, resource, or window.
- [ ] No train path crosses an unknown section.
- [ ] Isolation conflicts are enforced.
- [ ] Expired or missing permits produce visible warnings.
- [ ] Locked jobs remain unchanged during re-planning.
- [ ] Approval/export remains blocked for invalid or degraded runs.
- [ ] Export is labelled as a recommendation, not an authorized block.
- [ ] The UI shows `CONTROLLED-SCENARIO` provenance.

## Deliberately out of scope

- Live RailRadar-to-CP-SAT integration
- Railway system write-back
- Automatic block authorization
- Automatic permit issuance
- Production Railway section mapping
- Cross-corridor optimization
- Claims of trained-model accuracy

## Definition of done

The work is complete when a presenter can select either corridor, run the
planner, see the generated operational context, inspect conflicts and reasons,
lock and re-plan work, and export a clearly labelled recommendation without
any false claim of Railway authorization.
