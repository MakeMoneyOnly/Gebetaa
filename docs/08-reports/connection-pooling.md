# Supabase Connection Pooling Configuration

## Overview

This document describes the connection pooling implementation for Supabase using Supavisor. Connection pooling improves database performance by reusing database connections instead of creating new ones for each request.

## Why Connection Pooling?

- **Reduces connection overhead**: Establishing a new database connection is expensive. Connection pooling reuses existing connections.
- **Improves latency**: Connection reuse reduces the time spent on connection setup.
- **Prevents connection exhaustion**: Limits the number of concurrent connections to protect the database.
- **Better serverless performance**: Particularly beneficial for serverless environments like Vercel where functions scale horizontally.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Next.js Server │────▶│  Supavisor     │────▶│  PostgreSQL    │
│  (Vercel)       │     │  (Pooler)      │     │  (Supabase)    │
│                 │     │  :6543         │     │  :5432          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Configuration

### Environment Variables

Add the following to your `.env.local`:

| Variable                              | Description                           | Default          | Required |
| ------------------------------------- | ------------------------------------- | ---------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_POOLER_ENABLED` | Enable/disable connection pooling     | `false`          | No       |
| `SUPABASE_POOL_MODE`                  | Pool mode: `transaction` or `session` | `transaction`    | No       |
| `SUPABASE_POOL_SIZE`                  | Connections per pool instance (1-50)  | `10`             | No       |
| `SUPABASE_POOL_MAX_CLIENTS`           | Max clients in pool (1-100)           | `20`             | No       |
| `SUPABASE_POOL_CONNECTION_TIMEOUT`    | Connection timeout in seconds (1-300) | `30`             | No       |
| `SUPABASE_POOL_IDLE_TIMEOUT`          | Idle timeout in seconds (60-3600)     | `1800`           | No       |
| `SUPABASE_POOLER_URL`                 | Direct pooler connection string       | Auto-constructed | No       |

### Pool Mode Options

#### Transaction Mode (Recommended)

- Connections are borrowed for a single query/transaction
- Best for most web applications
- Supports prepared statements with limitations

#### Session Mode

- Connections persist for the full client session
- Use only when you need:
    - PostgreSQL session features (e.g., `LISTEN`/`NOTIFY`)
    - Temporary tables
    - Prepared statements with global state

### Sizing Guidelines

| Expected Concurrent Users | Recommended Pool Size |
| ------------------------- | --------------------- |
| < 50                      | 5-10                  |
| 50-100                    | 10-20                 |
| 100-500                   | 20-30                 |
| > 500                     | 30-50                 |

**Note**: Each Vercel function instance gets its own pool. Start conservative and monitor.

## Supavisor Setup

### Enable Pooler in Supabase Dashboard

1. Go to **Settings** → **Database**
2. Find **Connection Pooler**
3. Enable the pooler
4. Note the pooler hostname (format: `pooler.[PROJECT-REF].supabase.co`)

### Connection String Format

```
postgresql://postgres:[PASSWORD]@pooler.[PROJECT-REF].supabase.co:6543/postgres
```

**Note**: Pooler uses port **6543** (not 5432).

## Health Check Integration

Connection pool configuration is included in the health check response:

```json
{
    "status": "healthy",
    "checks": {
        "supabase": {
            "status": "pass",
            "latencyMs": 45,
            "poolEnabled": true,
            "poolMode": "transaction",
            "poolSize": 10
        }
    }
}
```

Monitor the `/api/health` endpoint to track:

- `poolEnabled`: Whether pooling is active
- `poolMode`: Current pool mode (transaction/session)
- `poolSize`: Configured pool size

## Code Implementation

### Server Client

The server client automatically applies pool configuration:

```typescript
// src/lib/supabase/server.ts
import { getPoolConfig } from './pool';

return createServerClient<Database>(url, key, {
    cookies: {
        /* ... */
    },
    db: getPoolConfig().enabled
        ? {
              poolMode: getPoolConfig().mode,
              poolConfig: {
                  max: getPoolConfig().poolSize,
                  idleTimeoutMillis: getPoolConfig().idleTimeout * 1000,
                  connectionTimeoutMillis: getPoolConfig().connectionTimeout * 1000,
              },
          }
        : undefined,
});
```

### Pool Configuration Module

The pool configuration module (`src/lib/supabase/pool.ts`) provides:

- `getPoolConfig()`: Get full pool configuration
- `isPoolEnabled()`: Check if pooling is enabled
- `getPoolerUrl()`: Get pooler connection URL

## Monitoring & Troubleshooting

### Key Metrics to Monitor

1. **Connection pool utilization**: Track active/idle connections
2. **Database latency**: Ensure pooling doesn't add latency
3. **Pool exhaustion**: Monitor for connection timeout errors
4. **Error rates**: Track `pool_timeout`, `connection` errors

### Common Issues

| Error                   | Cause                 | Solution                         |
| ----------------------- | --------------------- | -------------------------------- |
| `pool_timeout`          | All connections busy  | Increase pool size               |
| `too many connections`  | Pool too large for DB | Reduce pool size                 |
| `connection refused`    | Pooler not enabled    | Enable in Supabase dashboard     |
| `authentication failed` | Wrong password        | Verify credentials in pooler URL |

## Best Practices

1. **Start with transaction mode**: Only use session mode if specifically needed
2. **Conservative pool sizing**: Start small, monitor, then adjust
3. **Monitor in production**: Use health checks and metrics
4. **Set appropriate timeouts**: Balance connection reuse with freshness
5. **Enable via feature flag**: Use `NEXT_PUBLIC_SUPABASE_POOLER_ENABLED` for easy toggle

## Related Documentation

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connection-pooling)
- [Supavisor Documentation](https://github.com/supabase/supavisor)
- [Health Check API](./health-check-api.md)
- [Performance SLOs](./performance-slos.md)
