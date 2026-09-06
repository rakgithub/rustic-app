# Theme and design tokens implementation guide

This guide explains how we will create one consistent theme for the shell,
account, and commerce applications.

The goal is simple: a component should describe **what it needs** (for example,
primary text or a page surface), never choose a hard-coded colour itself. The
active theme supplies the actual values.

## Target architecture

```text
Design-token source files
        |
        v
Generated CSS custom properties
        |
        +--> shared UI components
        |
        +--> shell
        |
        +--> account remote
        |
        +--> commerce remote
```

Use two shared libraries:

```text
libs/shared/design-tokens/  Theme data, generated CSS, and theme utilities
libs/shared/ui/             Reusable React components that consume the tokens
```

`shared/ui` depends on `shared/design-tokens`; applications depend on both.
Applications must not define their own competing theme variables.

## Step 1: Create the design-token library

Create an Nx library at `libs/shared/design-tokens`. It should own this shape:

```text
libs/shared/design-tokens/
  tokens/
    primitives.tokens.json
    semantic-light.tokens.json
    semantic-dark.tokens.json
    components.tokens.json
  src/
    generated/
      primitives.css
      themes.css
      components.css
    theme-controller.ts
    index.ts
```

The JSON files are the source of truth. The CSS files are generated output and
should not be edited by hand.

## Step 2: Define primitive tokens

Primitives are raw design decisions: palette values, spacing steps, font sizes,
font families, radii, shadows, and animation durations. They have no UI role.

`tokens/primitives.tokens.json`:

```json
{
  "color": {
    "neutral": {
      "0": { "$type": "color", "$value": "#ffffff" },
      "50": { "$type": "color", "$value": "#fafafa" },
      "950": { "$type": "color", "$value": "#09090b" }
    },
    "blue": {
      "600": { "$type": "color", "$value": "#2563eb" }
    }
  },
  "space": {
    "2": { "$type": "dimension", "$value": "0.5rem" },
    "4": { "$type": "dimension", "$value": "1rem" },
    "6": { "$type": "dimension", "$value": "1.5rem" }
  },
  "radius": {
    "sm": { "$type": "dimension", "$value": "0.375rem" },
    "md": { "$type": "dimension", "$value": "0.5rem" }
  }
}
```

Use primitive names such as `blue.600` and `space.4`. Do not use them directly
inside application components.

## Step 3: Define semantic theme tokens

Semantic tokens describe purpose: `text.primary`, `surface.default`,
`border.default`, and `action.primary`. Their values are aliases to primitives.

The names stay the same in every theme, but their values change.

`tokens/semantic-light.tokens.json`:

```json
{
  "color": {
    "text": {
      "primary": { "$type": "color", "$value": "{color.neutral.950}" },
      "muted": { "$type": "color", "$value": "#52525b" }
    },
    "surface": {
      "default": { "$type": "color", "$value": "{color.neutral.0}" },
      "raised": { "$type": "color", "$value": "{color.neutral.50}" }
    },
    "action": {
      "primary": { "$type": "color", "$value": "{color.blue.600}" }
    }
  }
}
```

`tokens/semantic-dark.tokens.json`:

```json
{
  "color": {
    "text": {
      "primary": { "$type": "color", "$value": "{color.neutral.50}" },
      "muted": { "$type": "color", "$value": "#a1a1aa" }
    },
    "surface": {
      "default": { "$type": "color", "$value": "{color.neutral.950}" },
      "raised": { "$type": "color", "$value": "#18181b" }
    },
    "action": {
      "primary": { "$type": "color", "$value": "#60a5fa" }
    }
  }
}
```

Do not make the dark theme by inverting every light colour. Choose each
semantic value for readable contrast and the intended visual hierarchy.

## Step 4: Add component tokens only where useful

Component tokens provide a stable public styling API for reusable components.
They should alias semantic tokens, not raw primitives.

`tokens/components.tokens.json`:

```json
{
  "button": {
    "primary": {
      "background": {
        "$type": "color",
        "$value": "{color.action.primary}"
      },
      "foreground": {
        "$type": "color",
        "$value": "#ffffff"
      },
      "radius": {
        "$type": "dimension",
        "$value": "{radius.md}"
      }
    }
  }
}
```

Do not create a component token for every declaration. Start with public,
reused components such as buttons, inputs, cards, and dialogs.

## Step 5: Generate CSS variables

Use Style Dictionary to transform the token JSON into CSS. It understands the
Design Tokens Community Group format and can preserve aliases as CSS variable
references.

The generated CSS should have this behavior:

```css
/* primitives.css */
:root {
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-950: #09090b;
  --color-blue-600: #2563eb;
  --space-4: 1rem;
  --radius-md: 0.5rem;
}

/* themes.css */
:root,
[data-theme="light"] {
  --color-text-primary: var(--color-neutral-950);
  --color-surface-default: var(--color-neutral-0);
  --color-action-primary: var(--color-blue-600);
  color-scheme: light;
}

[data-theme="dark"] {
  --color-text-primary: var(--color-neutral-50);
  --color-surface-default: var(--color-neutral-950);
  --color-action-primary: #60a5fa;
  color-scheme: dark;
}
```

CSS custom properties are important here: when account and commerce are loaded
as Module Federation remotes, they inherit variables from the shell document
without depending on a shared React Context instance.

Add a `tokens:build` script that regenerates CSS and run it in CI. Either commit
the generated CSS or always generate it before `build`; choose one policy and
apply it consistently. This repository commits generated token CSS, so changes
to token JSON and their generated CSS can be reviewed together.

## Step 6: Make components use semantic tokens

Reusable components in `libs/shared/ui` should use semantic or component
variables:

```css
.buttonPrimary {
  background: var(--button-primary-background);
  border-radius: var(--button-primary-radius);
  color: var(--button-primary-foreground);
  padding: var(--space-2) var(--space-4);
}
```

Application and feature CSS follows the same rule:

```css
.page {
  background: var(--color-surface-default);
  color: var(--color-text-primary);
}
```

Avoid these in component CSS:

```css
color: #09090b;
background: white;
padding: 16px;
```

Use a lint rule or a review rule to prevent new hard-coded colours except in
token source files.

## Step 7: Select and persist the theme

The shell owns the user setting: `light`, `dark`, or `system`. It sets the
resolved value on the document root.

```ts
export type ThemePreference = 'light' | 'dark' | 'system';

export function applyTheme(preference: ThemePreference): void {
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;

  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
```

Store the preference in `localStorage`. A small initialization script should run
before React mounts so the page does not briefly flash the wrong theme.

The shell controls the setting in composed mode. Account and commerce use the
same shared initializer only when they run standalone on ports 5101 and 5102.

## Step 8: Import the CSS once per standalone application

Each standalone entry point imports the generated theme stylesheet:

```ts
import 'design-tokens/theme.css';
```

The shell imports it for the composed application. The provider applications
also import it so direct local development and independent deployments look
correct. Importing the same CSS in a remote is safe; the variables have the
same names and values.

## Step 9: Configure Storybook

Storybook is the documentation and visual-testing environment for
`libs/shared/ui`.

1. Import the generated CSS from `.storybook/preview.ts`.
2. Add a global decorator that sets `data-theme` to `light` or `dark`.
3. Add a toolbar selector for `light`, `dark`, and `system`.
4. Write stories for every shared component and its important states.
5. Review every visual change in both light and dark modes.

The current shared UI Storybook implements this configuration and includes
stories for the initial `Button` and `Card` components.

The Storybook manager UI has its own theme setting. That is optional and
separate from the component theme rendered in stories.

## Step 10: Accessibility checks

For each theme, verify:

- Text/background and interactive-state contrast meet WCAG requirements.
- Focus indicators remain visible.
- Disabled states are distinguishable without relying only on colour.
- Browser controls, scrollbars, and form elements use the correct mode through
  `color-scheme`.
- `prefers-reduced-motion` is respected for theme-related transitions.
- Forced-colors/high-contrast mode does not hide important information.

The design-token test suite enforces the 4.5:1 WCAG AA threshold for the
initial text, action, and status foreground/background pairs in both themes.

Do not animate the initial theme application. If adding a theme transition,
keep it short and disable it for users who request reduced motion.

## Step 11: Test and enforce the system

Add these checks over time:

1. Token build validation: CI runs `pnpm tokens:build` and fails if the
   generated CSS was not committed.
2. Unit tests: `applyTheme` resolves light, dark, and system correctly.
3. Storybook build: CI compiles every shared-component story using the shared
   theme stylesheet and toolbar configuration.
4. Accessibility tests: token contrast tests run for both themes; add
   component and critical-path checks as components and user journeys grow.
5. CI build: shell, account, and commerce compile using the shared styles.

When a token changes, the affected applications should be tested together:

```bash
pnpm exec nx affected -t test build --base=main --head=HEAD
```

## Implementation order

Use this order to keep the change small and reviewable:

1. Create `shared/design-tokens` and add a minimal light theme.
2. Generate/import CSS in shell, account, and commerce.
3. Add dark semantic tokens and the shell theme switcher.
4. Convert the first shared components in `shared/ui` to token usage.
5. Add Storybook theme switching and stories.
6. Convert feature and application CSS gradually.
7. Add visual and accessibility checks in CI.

## Rules to remember

- Primitive tokens are raw values; semantic tokens express meaning.
- Themes change semantic-token values, not component source code.
- Components consume semantic/component tokens, never raw colours.
- The shell owns the selected theme in composed mode.
- Every provider must initialize the same theme when running standalone.
- Storybook previews all shared components in every supported theme.
