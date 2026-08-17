import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CareerPathService } from '../../core/services/career-path.service';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-career-path',
  standalone: true,
  imports: [RouterLink, ProgressBarComponent],
  templateUrl: './career-path.html',
  styleUrl: './career-path.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerPathComponent {
  protected readonly careerPath = inject(CareerPathService);
}
