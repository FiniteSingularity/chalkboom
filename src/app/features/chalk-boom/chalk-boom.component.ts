import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChalkboomBotService,
  IrcMessage,
} from 'src/app/services/chalkboom-bot.service';

@Component({
  standalone: true,
  selector: 'app-chalk-boom',
  imports: [AsyncPipe, NgIf],
  templateUrl: './chalk-boom.component.html',
  styleUrls: ['./chalk-boom.component.scss'],
})
export class ChalkBoomComponent implements OnInit {
  phase: 'startup' | 'wagering' | 'playing' | 'game-over' = 'startup';
  gameTime = 90000; // 90 seconds
  signupTime = 20000; // 20 seconds
  wagerTime = 60000; // 60 seconds

  // Track game progression
  elapsedTime = 0;
  progess = 0;
  startTime = 0;
  lastRenderTime = 0;

  playerSpeed = 450; // px/sec

  scores: Record<string, number> = {};

  boomRate = 15;

  lastBoom$: Observable<IrcMessage | null>;
  lastMe$: Observable<IrcMessage | null>;

  constructor(private chatBot: ChalkboomBotService) {
    this.lastBoom$ = chatBot.lastBoom$;
    this.lastMe$ = chatBot.lastMe$;
  }

  ngOnInit(): void {
    console.log('chalkboom app component onInit');
  }

  chatInit(): void {}

  sendMessage() {
    this.chatBot.sendMessage('finitesingularity', 'Hello World');
  }
}
