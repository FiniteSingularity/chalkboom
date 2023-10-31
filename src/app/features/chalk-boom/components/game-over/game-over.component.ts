import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss'],
})
export class GameOverComponent {
  @Input() winner!: string | null;
}
