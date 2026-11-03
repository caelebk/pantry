import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Pantry brand mark: the Material Symbols "skillet" glyph (font loaded in index.html,
 * subset to this one icon). Set the glyph size in pixels with `size`.
 */
@Component({
  selector: 'pantry-skillet-icon',
  standalone: true,
  host: { class: 'inline-flex items-center justify-center', 'aria-hidden': 'true' },
  template: `<span class="material-symbols-outlined leading-none" [style.font-size.px]="size()"
    >skillet</span
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkilletIconComponent {
  size = input<number>(20);
}
