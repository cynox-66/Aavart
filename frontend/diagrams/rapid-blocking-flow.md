# Rapid Blocking Flow Diagram

The complete Emergency Rapid-Block workflow from incident report to dispatch.

## Full Rapid-Block Flow

```mermaid
flowchart TD
    START([🚨 Incident Occurs\nRail fracture, Signal failure,\nOHE breakdown, etc.]) 

    START --> HOME["Home Screen\n[🚨 Emergency Block Planning]"]

    HOME -->|Click Emergency Block Planning| EMRG_PAGE["Emergency Rapid-Block Mode\n🔴 LIVE SYSTEM — Current Target: SNAP-014\nNo 5-step wizard shown"]

    EMRG_PAGE --> FORM["Incident Form\n────────────────────────────────\nIncident Type: [Rail Fracture ▼]\nSection: [ST-03 AKW-BHU ▼]\nDuration: [4 Hours ▼]\nNotes: Rail snapped at km 512\n────────────────────────────────\n[⚙️ Inject & Re-Optimize]"]

    FORM -->|Form invalid| VALIDATION_ERR["Show field errors\nRequired fields highlighted"]
    VALIDATION_ERR --> FORM

    FORM -->|Submit| API_CALL["POST /rapidblock-requests\n{base_run_id, actor, justification,\nsource_reported_at, urgent_job}"]

    API_CALL --> AUTH_CHECK{Actor in\nallowlist?}
    AUTH_CHECK -->|No| REJECTED_AUTH["REJECTED: UNAUTHORISED_ACTOR\n'Not authorized to submit\nemergency requests'"]
    REJECTED_AUTH --> HOME

    AUTH_CHECK -->|Yes| SCOPE_CHECK{Job within\nplanning scope?}
    SCOPE_CHECK -->|No| REJECTED_SCOPE["REJECTED: OUTSIDE_PLANNING_SCOPE\n'Section/asset outside\ncurrent plan scope'"]
    REJECTED_SCOPE --> FORM

    SCOPE_CHECK -->|Yes| WINDOW_CHECK{Eligible window\nexists?}
    WINDOW_CHECK -->|No| REJECTED_WINDOW["REJECTED: NO_ELIGIBLE_WINDOW\n'No available maintenance window\nfor this job duration'"]
    REJECTED_WINDOW --> FORM

    WINDOW_CHECK -->|Yes| LOCK_CHECK{Conflicts with\nlocked items?}
    LOCK_CHECK -->|Yes| REJECTED_LOCK["REJECTED: LOCK_CONFLICT\n'Emergency job conflicts with\na manually locked item'"]
    REJECTED_LOCK --> FORM

    LOCK_CHECK -->|No| OPTIMIZATION["Backend creates derived snapshot\nRuns CP-SAT optimizer\nEmergency job = hard constraint"]

    OPTIMIZATION --> OPT_RESULT{Optimization\nresult?}

    OPT_RESULT -->|CANDIDATE_READY\nEmergency job scheduled| IMPACT["Right panel updates:\n────────────────────────────────\nCorridor map: blast radius shown\n📍 Rail Fracture km 512\nSection AKW-BHU: RED\n────────────────────────────────\nCASCADE IMPACT:\n4 maintenance jobs rescheduled\n2 commercial trains delayed\n────────────────────────────────\n[⚡ Approve Emergency Dispatch]"]

    OPT_RESULT -->|NO_CANDIDATE\nCan't fit emergency job| NO_CANDIDATE["Right panel:\n'No Feasible Slot Found'\nReason: NO_ELIGIBLE_WINDOW\nor TRAIN_PATH_CONFLICT\n\n[Modify and Retry]"]

    NO_CANDIDATE --> FORM

    IMPACT -->|User reviews impact| REVIEW{Acceptable\nimpact?}

    REVIEW -->|No| EXIT_HOME["[Exit to Home]\nNo changes made"]
    EXIT_HOME --> HOME

    REVIEW -->|Yes| CONFIRM["Confirmation Dialog:\n'You are about to approve emergency\ndispatch for SNAP-014-EMG.\n4 jobs will be rescheduled.\nContinue?'\n[Cancel] [Confirm Emergency Dispatch]"]

    CONFIRM -->|Cancel| IMPACT
    CONFIRM -->|Confirm| APPROVE["POST /planning-runs/child_run_id/approve\n{reviewer: actor, comment: justification}"]

    APPROVE --> APPROVE_RESULT{Approval\nresult?}

    APPROVE_RESULT -->|200 OK| SUCCESS["Success Modal (overlay):\n────────────────────────────────\n✅ EMERGENCY DISPATCH SUCCESSFUL\nSNAP-014-EMG created and dispatched\nChanges: 4 jobs rescheduled\n         2 locked jobs preserved\n────────────────────────────────\n[Return to Home Dashboard]"]

    APPROVE_RESULT -->|Error| APPROVE_FAIL["Error inline:\n'Emergency approval failed. Try again.'\n[Retry Approval]"]
    APPROVE_FAIL --> APPROVE

    SUCCESS --> HOME
```

## Backend State Machine for RapidBlock

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : POST /rapidblock-requests received
    SUBMITTED --> VALIDATING : Backend starts validation

    VALIDATING --> REJECTED : Actor unauthorized\nOR outside scope\nOR no eligible window\nOR lock conflict

    VALIDATING --> PLANNING : All checks passed\nDerived snapshot created

    PLANNING --> CANDIDATE_READY : Emergency job scheduled\nValidator passed\nState FEASIBLE or OPTIMAL

    PLANNING --> NO_CANDIDATE : Emergency job could not be scheduled\nOR validator failed
    PLANNING --> NO_CANDIDATE : Child run state = INFEASIBLE

    CANDIDATE_READY --> [*] : Frontend calls POST /approve on child_run_id

    REJECTED --> [*] : Terminal state (auditable)
    NO_CANDIDATE --> [*] : Terminal state (frontend can retry with new request)
```

## Emergency vs Normal Plan — Key Differences

```mermaid
flowchart LR
    subgraph NORMAL ["Normal Planning Wizard"]
        N1[Step 1: Upload Data]
        N2[Step 2: Validate]
        N3[Step 3: Create Plan]
        N4[Step 4: Review]
        N5[Step 5: Approve]
        N1-->N2-->N3-->N4-->N5
    end

    subgraph EMERGENCY ["Emergency Rapid-Block Mode"]
        E1[Incident Form]
        E2[POST /rapidblock-requests\nIncludes validation + optimization]
        E3[Review Cascade Impact]
        E4[Approve Emergency Dispatch]
        E1-->E2-->E3-->E4
    end

    NORMAL -.->|"5 steps, full wizard"| DONE1([Plan Approved])
    EMERGENCY -.->|"4 steps, no wizard UI"| DONE2([Emergency Dispatched])
```
