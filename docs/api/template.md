# API Contract Template

Use this template for every new endpoint or contract change.

## 1) Endpoint Overview

- Method:
- Path:
- Owner:
- Task ID:
- Status: Draft | In Review | Approved | Deprecated

## 2) Purpose

Describe business intent and primary use cases.

## 3) Authentication and Authorization

- Auth required: Yes/No
- Allowed roles:
- Tenant scoping rule:
- RLS dependencies:

## 4) Request Contract

### Query Params

| Name | Type | Required | Description |
|---|---|---|---|

### Path Params

| Name | Type | Required | Description |
|---|---|---|---|

### Request Body Schema

```json
{}
```

### Validation Rules

- 

## 5) Response Contract

### Success Response

Status code:

```json
{
  "data": {}
}
```

### Error Responses

| Status | Code | Meaning |
|---|---|---|

```json
{
  "error": "message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## 6) Side Effects

- DB writes:
- Audit logs:
- Events/webhooks:

## 7) Idempotency and Concurrency

- Idempotency key requirement:
- Conflict handling:
- Retry behavior:

## 8) Observability

- Structured logs:
- Metrics:
- Alert thresholds:

## 9) Security Notes

- Threats considered:
- Abuse/rate-limit controls:
- Sensitive fields handling:

## 10) Testing

- Unit tests:
- Integration tests:
- E2E/manual test cases:

## 11) Rollout Plan

- Feature flag:
- Rollout cohort:
- Rollback plan:
