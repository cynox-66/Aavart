# Domain Glossary

Use these meanings consistently in code, UI, tests, and presentations.

| Term | Meaning |
|---|---|
| Job | A maintenance task that may be scheduled in a planning window. |
| Block | A time interval in which maintenance work can occur under defined railway restrictions. |
| Planning window | An allowed start/end interval for work on a section. |
| Corridor | The bounded set of railway sections included in one planning run. |
| Section | A track or infrastructure segment identified by `section_id`. |
| Asset | The infrastructure item receiving maintenance. |
| Resource | A team, machine, or other capacity required by a job. |
| Conflict group | A set of jobs that cannot overlap. |
| Isolation zone | A protected railway area whose work cannot overlap with incompatible work or train paths. |
| Train path | A planned movement interval that constrains maintenance work. |
| Snapshot | An immutable, validated copy of all inputs used by a planning run. |
| Ruleset | A versioned set of safety, compatibility, objective, and approval rules. |
| Candidate plan | A solver result that still requires independent validation and human review. |
| Locked item | An accepted schedule item that re-planning must preserve exactly. |
| Re-plan | A new run based on a snapshot and existing locks, limited to affected unlocked work. |
| Reason code | A stable machine-readable explanation for scheduling or rejecting a job. |
| Approval | A human decision that makes a valid candidate eligible for export. |
| Export | A CSV/PDF representation of an approved plan. It is not railway sanctioning. |
