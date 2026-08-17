import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--control-radius,0.3125rem)] text-xs font-medium transition-[background-color,border-color,color,box-shadow] duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary:
          'border border-[var(--control-border,var(--border))] bg-secondary text-secondary-foreground hover:bg-[var(--control-surface-hover,var(--accent))] active:bg-[var(--control-surface-pressed,var(--accent))]',
        outline:
          'border border-[var(--control-border,var(--border))] bg-[var(--control-surface,var(--background))] hover:bg-[var(--control-surface-hover,var(--accent))] active:bg-[var(--control-surface-pressed,var(--accent))]',
        ghost:
          'border border-transparent hover:bg-[var(--control-surface-hover,var(--accent))] active:bg-[var(--control-surface-pressed,var(--accent))]',
        subtle:
          'border border-transparent bg-muted/70 text-foreground hover:bg-[var(--control-surface-hover,var(--accent))]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'h-auto rounded-none p-0 text-foreground underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-6 px-1.5 text-[0.6875rem]',
        sm: 'h-[var(--control-height-compact,1.75rem)] px-2 text-xs',
        md: 'h-[var(--control-height,2rem)] px-2.5',
        lg: 'h-9 px-3 text-sm',
        icon: 'size-[var(--control-height,2rem)] p-0',
        'icon-sm': 'size-[var(--control-height-compact,1.75rem)] p-0',
        'icon-xs': 'size-6 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export const badgeVariants = cva(
  'inline-flex min-h-4 items-center gap-1 rounded-[var(--control-radius,0.3125rem)] border px-1.5 py-px text-[0.625rem] font-medium leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-muted-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  },
)

export const inputClass =
  'flex h-[var(--control-height,2rem)] w-full rounded-[var(--control-radius,0.3125rem)] border border-[var(--control-border,var(--input))] bg-[var(--control-surface,var(--background))] px-2.5 py-1 text-xs text-foreground transition-[border-color,background-color,box-shadow] placeholder:text-muted-foreground/75 hover:border-foreground/20 focus-visible:border-[var(--focus-outline,var(--ring))] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-outline,var(--ring))] disabled:cursor-not-allowed disabled:opacity-50'

export const panelClass =
  'rounded-[var(--overlay-radius,0.4375rem)] border border-border bg-card text-card-foreground'

export const menuItemClass =
  'relative flex min-h-[var(--control-height-compact,1.75rem)] cursor-default select-none items-center gap-2 rounded-[var(--control-radius,0.3125rem)] px-2 py-1 text-xs outline-none transition-colors focus:bg-[var(--control-surface-hover,var(--accent))] focus:text-accent-foreground data-[highlighted]:bg-[var(--control-surface-hover,var(--accent))] data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45'
