import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayerData } from 'src/app/models/player.model';
import {
  ChalkboomBotService,
  IrcMessage,
} from 'src/app/services/chalkboom-bot.service';
import {
  ChalkboomService,
  GameStage,
} from 'src/app/services/chalkboom.service';
import { PlayerComponent } from './components/player/player.component';
import { BoomComponent } from './components/boom/boom.component';
import { Boom } from 'src/app/models/boom.model';
import { ScoreComponent } from './components/score/score.component';
import { GameOverComponent } from './components/game-over/game-over.component';
import { WagerBoardComponent } from './components/wager-board/wager-board.component';
import { TauService } from 'src/app/services/tau.service';
import { PredictionWagers } from 'src/app/models/prediction.models';
import { PredictionProgressEventData } from 'tau-js-client-forked/src/lib/events/prediction-progress/prediction-progress-event-data';

@Component({
  standalone: true,
  selector: 'app-chalk-boom',
  imports: [
    AsyncPipe,
    NgIf,
    NgFor,
    PlayerComponent,
    BoomComponent,
    ScoreComponent,
    GameOverComponent,
    WagerBoardComponent,
  ],
  templateUrl: './chalk-boom.component.html',
  styleUrls: ['./chalk-boom.component.scss'],
})
export class ChalkBoomComponent implements OnInit {
  phase: 'startup' | 'wagering' | 'playing' | 'game-over' | '' = '';
  gameTime = 9000; // 90 seconds
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
  players$: Observable<PlayerData[]>;
  booms$: Observable<Boom[]>;
  score$: Observable<{ Red: number; Blue: number }>;
  phase$: Observable<GameStage>;
  targetScore$: Observable<number>;
  winner$: Observable<string | null>;
  wagers$: Observable<PredictionProgressEventData>;

  constructor(
    private chatBot: ChalkboomBotService,
    private tau: TauService,
    private game: ChalkboomService
  ) {
    this.lastBoom$ = chatBot.lastBoom$;
    this.lastMe$ = chatBot.lastMe$;
    this.players$ = game.players$;
    this.booms$ = game.booms$;
    this.score$ = game.score$;
    this.phase$ = game.stage$;
    this.targetScore$ = game.targetScore$;
    this.winner$ = game.winner$;
    this.wagers$ = tau.wagers$;
  }

  ngOnInit(): void {
    console.log('chalkboom app component onInit');
    this.wageringPhase();
  }

  chatInit(): void {}

  sendMessage() {
    this.chatBot.sendMessage('finitesingularity', 'Hello World');
  }

  wageringPhase() {
    this.game.setGameStage('wagering');
    this.game.setupPredictions();
    setTimeout(() => {
      this.signupPhase();
    }, this.wagerTime);
  }

  signupPhase() {
    this.game.setGameStage('signup');
    setTimeout(() => {
      this.gameInit();
    }, this.signupTime);
  }

  gameInit() {
    this.game.initGame();
    this.game.setGameStage('playing');
  }

  gameOver() {
    this.game.setGameStage('game-over');
  }
}
