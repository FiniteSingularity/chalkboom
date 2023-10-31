import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PlayerData } from 'src/app/models/player.model';

@Component({
  standalone: true,
  selector: 'app-player',
  imports: [NgStyle],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player!: PlayerData;
}
