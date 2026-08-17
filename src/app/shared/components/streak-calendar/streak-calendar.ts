import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DailyActivity } from '../../../core/models';

interface DayCell {
  label: string;
  active: boolean;
  isToday: boolean;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

@Component({
  selector: 'app-streak-calendar',
  standalone: true,
  templateUrl: './streak-calendar.html',
  styleUrl: './streak-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreakCalendarComponent {
  readonly activity = input.required<DailyActivity[]>();

  protected readonly days = computed<DayCell[]>(() => {
    const activityByDate = new Map(this.activity().map((a) => [a.date, a]));
    const todayIso = new Date().toISOString().slice(0, 10);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      const record = activityByDate.get(iso);
      return {
        label: DAY_LABELS[d.getDay()],
        active: !!record && record.minutesStudied > 0,
        isToday: iso === todayIso,
      };
    });
  });
}
