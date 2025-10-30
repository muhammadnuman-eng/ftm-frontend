# FTM Web Style Guide

This style guide defines the visual language, component patterns, and development conventions for the FTM Web application.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Architecture](#component-architecture)
6. [Styling Conventions](#styling-conventions)
7. [Animation & Transitions](#animation--transitions)
8. [Accessibility](#accessibility)
9. [Code Standards](#code-standards)

## Design Philosophy

### Core Principles

1. **Dark-First Design**: The interface is optimized for dark mode with a premium, professional aesthetic
2. **Consistency**: Maintain visual and behavioral consistency across all components
3. **Performance**: Prioritize performance with efficient CSS and minimal runtime calculations
4. **Composability**: Build complex interfaces from simple, reusable components

## Color System

### Design Tokens

The color system uses OKLCH color space for perceptually uniform color transitions and better accessibility.

```css
/* Core Palette */
--background: oklch(14.7% 0.004 49.25);      /* Dark stone background */
--foreground: oklch(1 0 0);                  /* Pure white text */
--primary: oklch(69.05% 0.1099 216.24);      /* Blue primary */
--secondary: oklch(97% 0 0);                 /* Light gray */
--accent: oklch(21.6% 0.006 56.043);         /* Subtle accent */
--destructive: oklch(57.7% 0.245 27.325);    /* Error red */
```

### Brand Colors

```css
/* Indigo Scale (50-950) */
--color-indigo-500: #0a95e6;  /* Primary indigo */
--color-indigo-600: #0079ca;  /* Hover state */

/* Blue Scale (50-950) */
--color-blue-400: #0dfbfd;    /* Bright cyan */
--color-blue-500: #00dde3;    /* Primary blue */
```

### Gradient Usage

```css
/* Primary brand gradient */
background: linear-gradient(to bottom right, 
    var(--color-blue-500) 0%, 
    var(--color-indigo-500) 25%, 
    var(--color-indigo-700) 100%
);

/* Button gradient with hover reversal */
.button-primary {
    background: linear-gradient(to bottom right,
        var(--color-blue-500) 0%,
        var(--color-indigo-500) 25%
    );
}
.button-primary:hover {
    background: linear-gradient(to bottom right,
        var(--color-indigo-500) 0%,
        var(--color-blue-500) 100%
    );
}
```

### Semantic Colors

- **Background**: Dark stone (`#0c0a09`) - Primary surface
- **Card**: Slightly elevated surface with subtle opacity
- **Border**: White with 10% opacity (`border-white/10`)
- **Text Primary**: Pure white (`#ffffff`)
- **Text Muted**: 55.6% lightness for secondary text

## Typography

### Font Stack

```css
--font-sans: "Inter", "Geist", ui-sans-serif, system-ui, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|--------|
| Hero H1 | 6xl (3.75rem) | Semibold | Tight | Main headlines |
| Hero H2 | 4xl (2.25rem) | Semibold | Tight | Section titles |
| H3 | 2xl (1.5rem) | Semibold | Normal | Subsection titles |
| Body | sm (0.875rem) | Normal | 1.5 | Default text |
| Caption | xs (0.75rem) | Normal | 1.5 | Small text, labels |

### Text Treatments

```tsx
/* Gradient text */
<span className="bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">
    Gradient Text
</span>

/* Balanced text for better line breaks */
<h2 className="text-balance">
    Long headline that breaks nicely
</h2>
```

## Spacing & Layout

### Spacing Scale

Using Tailwind's default spacing scale with 4px base:

- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `10` = 2.5rem (40px)
- `12` = 3rem (48px)

### Container Widths

```tsx
/* Standard content container */
<div className="mx-auto max-w-7xl px-6">

/* Narrow content (forms, articles) */
<div className="mx-auto max-w-3xl px-6">

/* Wide content (dashboards) */
<div className="mx-auto max-w-screen-2xl px-6">
```

### Grid Systems

```tsx
/* Responsive grid with auto-fill */
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

/* Feature grid */
<div className="grid gap-6 md:grid-cols-3">
```

## Component Architecture

### Component Patterns

All components follow the shadcn/ui pattern with these conventions:

1. **Compound Components**: Use multiple exported components for complex structures

```tsx
export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    CardAction
};
```

2. **Data Slots**: Use `data-slot` attributes for component identification

```tsx
<div data-slot="card">
<div data-slot="card-header">
<div data-slot="card-title">
```

3. **Variant System**: Use CVA for component variants

```tsx
const buttonVariants = cva(
    "base-classes",
    {
        variants: {
            variant: {
                default: "default-classes",
                outline: "outline-classes"
            },
            size: {
                default: "h-9 px-4",
                sm: "h-8 px-3",
                lg: "h-12 px-6"
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default"
        }
    }
);
```

### Component Props Pattern

```tsx
interface ComponentProps extends React.ComponentProps<"div">,
    VariantProps<typeof componentVariants> {
    asChild?: boolean;
}

function Component({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    ...props 
}: ComponentProps) {
    const Comp = asChild ? SlotPrimitive.Slot : "div";
    
    return (
        <Comp
            className={cn(componentVariants({ variant, size, className }))}
            {...props}
        />
    );
}
```

## Styling Conventions

### Class Name Organization

Use the `cn()` utility for merging classes with proper precedence:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
    "base-classes",
    "responsive-classes",
    variant && "variant-classes",
    className  // User overrides last
)}>
```

### Tailwind Class Order (Biome Auto-sorted)

Classes are automatically sorted by Biome in this order:
1. Layout (display, position)
2. Flexbox/Grid
3. Spacing (margin, padding)
4. Sizing (width, height)
5. Typography
6. Background
7. Border
8. Effects

### State Modifiers

```tsx
/* Focus states */
"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

/* Hover states */
"hover:bg-accent hover:text-accent-foreground"

/* Disabled states */
"disabled:pointer-events-none disabled:opacity-50"

/* Dark mode (automatic with dark class) */
"dark:bg-accent/50 dark:text-white"
```

### Responsive Design

Mobile-first approach with breakpoints:

```tsx
"text-sm md:text-base lg:text-lg"  // Progressive enhancement
"hidden md:block"                    // Show on desktop
"block md:hidden"                    // Show on mobile only
```

## Animation & Transitions

### Transition Classes

```tsx
/* Default transition */
"transition-all"

/* Specific transitions */
"transition-colors duration-200"
"transition-transform duration-300 ease-out"
```

### Custom Animations

```css
/* Marquee animation */
@keyframes marquee {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(calc(-100% - var(--gap)), 0, 0); }
}

.animate-marquee {
    animation: marquee var(--duration) infinite linear;
}
```

### Animation Guidelines

1. Use CSS transforms for performance
2. Prefer `transform` and `opacity` for animations
3. Add `will-change` for heavy animations
4. Use `transition-all` sparingly (prefer specific properties)

## Accessibility

### Focus Management

```tsx
/* Visible focus indicators */
"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

/* Skip unnecessary focus for mouse users */
"focus:outline-none focus-visible:outline-2"
```

### ARIA Attributes

```tsx
/* Invalid states */
"aria-invalid:border-destructive aria-invalid:ring-destructive/20"

/* Loading states */
<button aria-busy={isLoading} aria-disabled={isLoading}>
    {isLoading ? "Loading..." : "Submit"}
</button>
```

### Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use semantic elements (`<nav>`, `<main>`, `<article>`)
- Provide alt text for images
- Use buttons for actions, links for navigation

## Code Standards

### File Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   │   ├── button.tsx
│   │   └── card.tsx
│   └── [feature]/    # Feature components
│       ├── header.tsx
│       └── footer.tsx
├── lib/
│   └── utils.ts      # Utility functions
└── app/              # Next.js app directory
```

### Import Order

1. React/Next.js imports
2. External library imports
3. Internal components (`@/components`)
4. Internal utilities (`@/lib`)
5. Types
6. Styles

### TypeScript Conventions

```tsx
/* Props interface naming */
interface ComponentNameProps { }

/* Explicit return types for components */
export const Component = (): JSX.Element => { }

/* Use type over interface for unions/intersections */
type Variant = "default" | "outline" | "ghost";
```

### Component Naming

- PascalCase for components: `HeaderSection`
- camelCase for utilities: `formatDate`
- kebab-case for files: `header-section.tsx`
- SCREAMING_SNAKE_CASE for constants: `MAX_ITEMS`

### Formatting Rules (Biome)

- **Indentation**: 4 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: No semicolons (ASI)
- **Line length**: 100 characters recommended
- **Trailing commas**: Always in multiline

### Quality Checks

Before committing, always run:

```bash
bun check        # Format and lint
bun check-types  # TypeScript validation
```

## Component Examples

### Button Component

```tsx
<Button variant="default" size="lg" asChild>
    <Link href="/login">Get Started</Link>
</Button>
```

### Card Component

```tsx
<Card>
    <CardHeader>
        <CardTitle>Feature Title</CardTitle>
        <CardDescription>Brief description</CardDescription>
        <CardAction>
            <Button size="icon" variant="ghost">
                <SettingsIcon />
            </Button>
        </CardAction>
    </CardHeader>
    <CardContent>
        Content goes here
    </CardContent>
    <CardFooter>
        <Button>Action</Button>
    </CardFooter>
</Card>
```

### Form Input

```tsx
<div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
        id="email" 
        type="email" 
        placeholder="you@example.com"
        className="bg-white/5"
    />
</div>
```

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [CVA Documentation](https://cva.style)
- [Radix UI Primitives](https://radix-ui.com)