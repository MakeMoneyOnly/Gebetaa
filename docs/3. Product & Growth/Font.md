1. Global Variable Configuration
Add this to root CSS file. It defines the "Apple scale" using 16px as the base (1rem = 16px)

:root {
  /* Apple System Font Stack */
  --font-family-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typography Scale (rem units) */
  --text-xs: 0.75rem;    /* 12px - Captions/Labels */
  --text-sm: 0.875rem;   /* 14px - Secondary/Table Data */
  --text-base: 1rem;     /* 16px - Standard Body */
  --text-md: 1.0625rem;  /* 17px - Apple "Body" Default */
  --text-lg: 1.25rem;    /* 20px - H3/Subheads */
  --text-xl: 1.5rem;     /* 24px - H2/Section Headers */
  --text-2xl: 2.125rem;  /* 34px - H1/Large Title */
  --text-3xl: 3rem;      /* 48px - Dashboard Hero */

  /* Font Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Line Heights (Apple uses tighter leading for UI) */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
}


2. Global Element Styles
Apply these styles to HTML elements to ensure consistency across the entire dashboard and site.

body {
  font-family: var(--font-family-system);
  font-size: var(--text-md); /* 17px base for Apple feel */
  line-height: var(--leading-normal);
  color: #1d1d1f; /* Apple Dark Grey */
  -webkit-font-smoothing: antialiased;
}

h1 {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  letter-spacing: -0.022em; /* Apple-style tight tracking */
  line-height: var(--leading-tight);
}

h2 {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.017em;
}

.dashboard-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  color: #86868b; /* Secondary "Tertiary" Grey */
}

code, .mono-data {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}


3. Mobile vs. Desktop Strategy
Apple's "Dynamic Type" adjusts based on the device. Use media queries to scale the root size so all rem units adjust proportionally.

Mobile (< 768px): Keep the base at 16px or 17px for readability.
Desktop (> 768px): You can slightly increase titles while keeping body text consistent.

Use tabular-nums in our CSS for any changing data values to prevent the text from jumping as numbers update.