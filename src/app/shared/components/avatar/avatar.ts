import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<span class="avatar" [style.width.px]="size()" [style.height.px]="size()" [style.fontSize.px]="size() * 0.5">{{
    emoji()
  }}</span>`,
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly emoji = input<string>('🙂');
  readonly size = input<number>(40);
}
