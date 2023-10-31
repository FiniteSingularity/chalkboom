import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-score',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss'],
})
export class ScoreComponent {
  @Input() scores!: { Red: number; Blue: number };
  @Input() targetScore: number | null = 0.0;
}
