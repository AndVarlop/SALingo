import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LogoVariant = 'full' | 'icon';
export type LogoSize = 'sm' | 'md' | 'lg';

/**
 * SALingo's brand mark: two overlapping speech bubbles (conversation —
 * the core of language learning and call-center practice), rendered as one
 * inline SVG so it's never duplicated across templates. `variant="icon"`
 * for tight spaces (collapsed sidebar, favicon-adjacent contexts, mobile
 * topbar at its smallest); `variant="full"` pairs the mark with the
 * "SALingo" wordmark. Colors come from the existing --color-primary/
 * --color-primary-hover tokens (light/dark mode already handled by those),
 * not new hardcoded hex values — one visual identity, reused everywhere:
 * sidebar, topbar, auth pages, loading states.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly variant = input<LogoVariant>('full');
  readonly size = input<LogoSize>('md');
}
