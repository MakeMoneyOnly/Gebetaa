1. Global Variable Configuration
   Add this to root CSS file. It defines the "Apple scale" using 16px as the base (1rem = 16px)

:root {
/_ Apple System Font Stack _/
--font-family-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

/_ Typography Scale (rem units) _/
--text-xs: 0.75rem; /_ 12px - Captions/Labels _/
--text-sm: 0.875rem; /_ 14px - Secondary/Table Data _/
--text-base: 1rem; /_ 16px - Standard Body _/
--text-md: 1.0625rem; /_ 17px - Apple "Body" Default _/
--text-lg: 1.25rem; /_ 20px - H3/Subheads _/
--text-xl: 1.5rem; /_ 24px - H2/Section Headers _/
--text-2xl: 2.125rem; /_ 34px - H1/Large Title _/
--text-3xl: 3rem; /_ 48px - Dashboard Hero _/

/_ Font Weights _/
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/_ Line Heights (Apple uses tighter leading for UI) _/
--leading-tight: 1.2;
--leading-normal: 1.5;
}

2. Global Element Styles
   Apply these styles to HTML elements to ensure consistency across the entire dashboard and site.

body {
font-family: var(--font-family-system);
font-size: var(--text-md); /_ 17px base for Apple feel _/
line-height: var(--leading-normal);
color: #1d1d1f; /_ Apple Dark Grey _/
-webkit-font-smoothing: antialiased;
}

h1 {
font-size: var(--text-2xl);
font-weight: var(--weight-bold);
letter-spacing: -0.022em; /_ Apple-style tight tracking _/
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
color: #86868b; /_ Secondary "Tertiary" Grey _/
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
