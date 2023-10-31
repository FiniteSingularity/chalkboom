import { Injectable } from '@angular/core';
import { PlayerData, defaultPlayer } from '../models/player.model';
import { ChalkboomBotService, IrcMessage } from './chalkboom-bot.service';
import { ComponentStore } from '@ngrx/component-store';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import MersenneTwister from 'mersenne-twister';
import { Boom } from '../models/boom.model';
import { BoundingBox, Circle } from '../models/geometry.models';
import { PredictionDetails } from '../models/helix.models';

const teamColors = {
  Red: {
    playerColor: '#FFCCCC',
    boomColor: '#FF0000',
  },
  Blue: {
    playerColor: '#66CCFF',
    boomColor: '#0066FF',
  },
};

const BaseAccel = 0.03;

export type GameStage = 'wagering' | 'signup' | 'playing' | 'game-over' | '';
export interface GameState {
  stage: GameStage;
  booms: Boom[];
  players: PlayerData[];
  teamPlayerCounts: { Red: number; Blue: number };
  teamMaxRadius: { Red: number; Blue: number };
  teamScores: { Red: number; Blue: number };
  progress: number;
  speed: number;
  gameTime: number;
  elapsedTime: number;
  startTime: number;
  lastRender: number;
  fps: number;
  boomAcc: number;
  boomRate: number;
  targetScore: number;
  winner: 'Red' | 'Blue' | null;
  predictionDetails: PredictionDetails | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChalkboomService extends ComponentStore<GameState> {
  readonly players$ = this.select((s) => s.players);
  readonly booms$ = this.select((s) => s.booms);
  readonly stage$ = this.select((s) => s.stage);
  readonly score$ = this.select((s) => s.teamScores);
  readonly targetScore$ = this.select((s) => s.targetScore);
  readonly winner$ = this.select((s) => s.winner);
  rng: MersenneTwister;

  constructor(private bot: ChalkboomBotService) {
    super({
      players: [],
      booms: [],
      stage: '',
      teamPlayerCounts: { Red: 0, Blue: 0 },
      teamMaxRadius: { Red: 250.0, Blue: 250.0 },
      teamScores: { Red: 0.0, Blue: 0.0 },
      progress: 0.0,
      speed: 500.0,
      gameTime: 25000.0,
      elapsedTime: 0.0,
      startTime: 0.0,
      lastRender: 0.0,
      fps: 0.0,
      boomAcc: BaseAccel,
      boomRate: 15.0,
      targetScore: 50.0,
      winner: null,
      predictionDetails: null,
    });
    this.rng = new MersenneTwister();
    this.newPlayer();
    this.newBoom();
  }

  clear() {
    this.patchState({
      players: [],
    });
  }

  setGameStage(stage: 'wagering' | 'signup' | 'playing' | 'game-over' | '') {
    this.patchState({ stage });
  }

  setupPredictions() {
    this.bot.setupPrediction().subscribe((resp) => {
      this.get().predictionDetails = resp;
    });
  }

  closePredictions(winner: 'Red' | 'Blue') {
    const winningPrediction = this.get().predictionDetails?.outcomes.find(
      (outcome) => outcome.title === winner
    );
    setTimeout(() => {
      this.bot
        .closePrediction(
          this.get().predictionDetails!.id,
          winningPrediction!.id
        )
        .subscribe((resp) => {});
    }, 7500);
  }

  initGame() {
    this.assignTeams();
    window.requestAnimationFrame((t) => this.startGame(t));
  }

  randomizePlayer(player: PlayerData) {
    const width = this.rng.random() * (window.innerWidth - player.spriteWidth);
    const height =
      this.rng.random() * (window.innerHeight - player.spriteHeight);
    player.angle = 2.0 * Math.PI * this.rng.random();
    player.position = { x: width / 2, y: height / 2 };
    if (player.angle >= Math.PI / 2.0 && player.angle < (3.0 * Math.PI) / 2.0) {
      player.xDir = -1;
    } else {
      player.xDir = 1;
    }

    if (player.angle <= Math.PI) {
      player.yDir = -1;
    } else {
      player.yDir = 1;
    }
    return player;
  }

  randomizePlayerPositions() {
    const players = this.get().players;
    players.forEach((player) => {
      player = this.randomizePlayer(player);
    });
    this.patchState({
      players: [...players],
    });
  }

  readonly newPlayer = this.effect<void>(
    pipe(
      switchMap(() => {
        return this.bot.lastMe$.pipe(
          filter((lastMe) => lastMe !== null),
          filter((lastMe) => ['signup', 'playing'].includes(this.get().stage)),
          filter(
            (lastMe) =>
              !this.get().players.find(
                (player) => player.name === lastMe!.data.tags['display-name']
              )
          ),
          map((lastMe) => lastMe as IrcMessage)
        );
      }),
      tap((lastMe) => {
        const wager = lastMe.data.tags['badge-info']
          .split(',')
          .map((val) => val.split('/'))
          .find((val) => val[0] === 'predictions');
        const teamName = !!wager ? wager[1] : '';
        let player: PlayerData = {
          ...defaultPlayer,
          position: { x: 0.0, y: 0.0 },
          name: lastMe.data.tags['display-name'],
          teamName,
          boomAmount: 0.5,
        };
        player = this.randomizePlayer(player);
        this.get().players = [...this.get().players, { ...player }];
        this.patchState({
          players: [...this.get().players],
        });
        if (this.get().stage === 'playing') {
          this.assignTeams();
        }
      })
    )
  );

  readonly newBoom = this.effect<void>(
    pipe(
      switchMap(() => {
        return this.bot.lastBoom$.pipe(
          filter((lastBoom) => lastBoom !== null),
          filter((lastBoom) => this.get().stage === 'playing'),
          map((lastBoom) => lastBoom as IrcMessage)
        );
      }),
      tap((lastBoom) => {
        const player = this.get().players.find(
          (player) => player.name === lastBoom!.data.tags['display-name']
        );
        if (!player) {
          return;
        }
        const boomAmount = player.boomAmount;
        player.boomAmount = 0.0;
        const playerCounts = this.get().teamPlayerCounts;
        const maxRadius = boomAmount * 128.0;
        const curTeam = player.teamName as 'Red' | 'Blue';
        const otherTeam = curTeam === 'Red' ? 'Blue' : 'Red';
        const teamRatio = playerCounts[curTeam] / playerCounts[otherTeam];
        const scaledMaxRadius = Math.sqrt(
          Math.min(1.0, 1.0 / teamRatio) * maxRadius ** 2
        );
        const booms = this.get().booms;
        const zIndex = booms.length + 1;

        const underlying = booms.filter((boom) => {
          const rSum = boom.maxRadius + boomAmount * 128;
          const d2 =
            (boom.position.x - player.position.x) ** 2 +
            (boom.position.y - player.position.y) ** 2;
          return d2 < rSum ** 2;
        });
        const boomData: Boom = {
          playerName: player.name,
          team: player.teamName,
          position: { ...player.position },
          color: player.boomColor,
          zIndex,
          radius: 0.0,
          maxRadius: scaledMaxRadius,
          boomRate: this.get().boomRate,
          complete: false,
          overlap: [],
        };

        underlying.forEach((boom) => {
          boom.overlap.push(boomData);
        });

        this.patchState({
          booms: [...booms, boomData],
        });
      })
    )
  );

  assignTeams() {
    const assigned = this.get().players.filter(
      (player) => player.teamName !== ''
    );
    const unassigned = this.get().players.filter(
      (player) => player.teamName === ''
    );
    const playerCounts = assigned.reduce(
      (acc, player) => {
        acc[player.teamName as 'Red' | 'Blue'] += 1;
        return acc;
      },
      { Red: 0, Blue: 0 }
    );
    unassigned.forEach((player) => {
      const nextTeam =
        playerCounts.Blue > playerCounts.Red
          ? 'Red'
          : playerCounts.Red > playerCounts.Blue
          ? 'Blue'
          : this.rng.random() > 0.5
          ? 'Blue'
          : 'Red';
      player.teamName = nextTeam;
      playerCounts[nextTeam] += 1;
    });

    const players = this.get().players;
    players.forEach((player) => {
      player.boomColor =
        teamColors[player.teamName as 'Blue' | 'Red'].boomColor;
      player.teamColor =
        teamColors[player.teamName as 'Blue' | 'Red'].playerColor;
    });

    const playerCount = playerCounts.Red + playerCounts.Blue;
    let targetScore = 40.0;
    const additional = Math.min(
      Math.max(0.0, ((playerCount - 4) / 2) * 5.0),
      30.0
    );
    targetScore += additional;

    this.patchState({
      teamPlayerCounts: { ...playerCounts },
      players: [...players],
      targetScore,
    });
  }

  startGame(timestamp: number): void {
    this.patchState({
      elapsedTime: timestamp,
      lastRender: timestamp,
      startTime: timestamp,
    });
    // Add in zero out scores;
    window.requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(timestamp: number): void {
    const progress = timestamp - this.get().lastRender;
    const totalTime = timestamp - this.get().startTime;
    this.get().boomAcc = BaseAccel + 0.01 * Math.floor(totalTime / 10000);
    this.patchState({
      progress,
      fps: 1.0 / (progress / 1000.0),
    });
    this.update();
    this.patchState({
      elapsedTime: timestamp,
      lastRender: timestamp,
    });
    const scores = this.get().teamScores;
    const target = this.get().targetScore / 100.0;
    if (scores.Red < target && scores.Blue < target) {
      window.requestAnimationFrame((t) => this.gameLoop(t));
    } else {
      const winner = scores.Red >= target ? 'Red' : 'Blue';
      this.get().winner = winner;
      this.patchState({ stage: 'game-over' });
      this.closePredictions(winner);
    }
  }

  update() {
    this.updatePlayers();
    this.updateBooms();
    this.calculateScore();
  }

  updatePlayers() {
    const players = this.get().players;
    const progress = this.get().progress;
    const speed = this.get().speed;
    players.forEach((player) => {
      this.updatePlayer(player, progress, speed);
    });
  }

  updatePlayer(player: PlayerData, progress: number, speed: number) {
    const width = window.innerWidth - player.spriteWidth;
    const height = window.innerHeight - player.spriteHeight;

    const distance = (progress / 1000.0) * speed;

    let newX = player.position.x;
    if (Math.abs(Math.cos(player.angle)) > 1e-8) {
      newX = player.position.x + distance * Math.cos(player.angle);
    }
    let newY = player.position.y;
    if (Math.abs(Math.sin(player.angle)) > 1e-8) {
      newY = player.position.y - distance * Math.sin(player.angle);
    }

    const angleChange = newX > width || newX < 0 || newY > height || newY < 0;

    if (newX > width) {
      const xDiff = newX - width;
      newX = width - xDiff;
      if (player.yDir > 0) {
        const theta = player.angle - (3.0 * Math.PI) / 2.0;
        player.angle = (3.0 * Math.PI) / 2.0 - theta;
      } else {
        const theta = Math.PI / 2.0 - player.angle;
        player.angle = Math.PI / 2.0 + theta;
      }
      player.xDir = -1;
    } else if (newX < 0) {
      const xDiff = -newX;
      newX = xDiff;
      if (player.yDir > 0) {
        const theta = (3.0 * Math.PI) / 2.0 - player.angle;
        player.angle = (3.0 * Math.PI) / 2.0 + theta;
      } else {
        const theta = player.angle - Math.PI / 2.0;
        player.angle = Math.PI / 2.0 - theta;
      }
      player.xDir = 1;
    }

    if (newY > height) {
      const yDiff = newY - height;
      newY = height - yDiff;
      if (player.xDir > 0) {
        const theta = 2.0 * Math.PI - player.angle;
        player.angle = theta;
      } else {
        const theta = player.angle - Math.PI;
        player.angle = Math.PI - theta;
      }
      player.yDir = -1;
    } else if (newY < 0) {
      const yDiff = -newY;
      newY = yDiff;
      if (player.xDir > 0) {
        const theta = player.angle;
        player.angle = 2.0 * Math.PI - theta;
      } else {
        const theta = Math.PI - player.angle;
        player.angle = Math.PI + theta;
      }
      player.yDir = 1;
    }

    if (angleChange) {
      const randomJitter = (Math.random() * Math.PI) / 9.0;
      player.angle += Math.sign(player.angle) * randomJitter;
    }

    player.position = { x: newX, y: newY };
    const boomAmount = Math.min(
      1.0,
      player.boomAmount + (progress / 1000.0) * this.get().boomAcc
    );
    player.boomAmount = boomAmount;
  }

  updateBooms() {
    const progress = this.get().progress;
    const booms = this.get().booms;
    booms
      .filter((boom) => !boom.complete)
      .forEach((boom) => {
        const boomIncrement = (progress / 1000.0) * boom.boomRate;
        boom.radius = Math.min(boom.radius + boomIncrement, boom.maxRadius);
        if (boom.radius >= boom.maxRadius) {
          boom.complete = true;
        }
      });
  }

  calculateScore(): void {
    const scores = this.get().teamScores;
    scores['Red'] = 0;
    scores['Blue'] = 0;
    const booms = this.get().booms;
    booms.forEach((boom) => {
      const score = this.calculateBoomContribution(boom);
      scores[boom.team as 'Red' | 'Blue'] += score;
    });

    Object.keys(scores).forEach((key) => {
      scores[key as 'Red' | 'Blue'] /= window.innerHeight * window.innerWidth;
    });
    this.patchState({
      teamScores: { ...scores },
    });
  }

  calculateBoomContribution(boom: Boom): number {
    const circle: Circle = {
      center: boom.position,
      r: boom.radius,
      color: [0.0, 0.0, 0.0],
    };
    const overlapCircles: Circle[] = boom.overlap.map((overlapBoom) => {
      return {
        center: overlapBoom.position,
        r: overlapBoom.radius,
        color: [0.0, 0.0, 0.0],
      };
    });
    const compoundArea = this.estimateCompoundArea(circle, overlapCircles);
    return compoundArea;
  }

  estimateCompoundArea(
    circle: Circle,
    overlapCircles: Circle[],
    binSize = 1
  ): number {
    let area = 0;
    const bb = this.getBoundingBox(circle);
    for (let y = bb.minBound.y; y <= bb.maxBound.y; y += binSize) {
      let checked = false;
      let cBounds = this.scanLineBounds(circle, y);
      let scanLineArea = (cBounds.xMax - cBounds.xMin) * binSize;
      if (isNaN(scanLineArea)) {
        continue;
      }
      const scanLineOverlap = overlapCircles.filter((c) => {
        return c.center.y - c.r <= y && c.center.y + c.r >= y;
      });
      let overlapBounds: { xMin: number; xMax: number }[] = [];
      scanLineOverlap.forEach((slo) => {
        const bounds = this.scanLineBounds(slo, y);
        if (bounds.xMin < cBounds.xMax && bounds.xMax > cBounds.xMin) {
          bounds.xMin = Math.max(bounds.xMin, cBounds.xMin);
          bounds.xMax = Math.min(bounds.xMax, cBounds.xMax);
          overlapBounds.push({ ...bounds });
        }
      });
      overlapBounds = overlapBounds.sort((a, b) => (a.xMin < b.xMin ? -1 : 1));

      const constrainedBounds: any = [];
      overlapBounds.forEach((bounds) => {
        const length = constrainedBounds.length;
        if (length === 0) {
          constrainedBounds.push({ ...bounds });
        } else if (bounds.xMin <= constrainedBounds[length - 1].xMax) {
          constrainedBounds[length - 1].xMax = bounds.xMax;
        } else {
          constrainedBounds.push({ ...bounds });
        }
      });
      constrainedBounds.forEach((bounds: any) => {
        scanLineArea -= bounds.xMax - bounds.xMin;
      });
      area += scanLineArea;
    }

    return area;
  }

  scanLineBounds(circle: Circle, y: number) {
    const c = Math.sqrt(circle.r ** 2 - (y - circle.center.y) ** 2);
    const xMin = circle.center.x - c;
    const xMax = circle.center.x + c;
    return { xMin, xMax };
  }

  getBoundingBox(circle: Circle): BoundingBox {
    return {
      minBound: {
        x: circle.center.x - circle.r,
        y: circle.center.y - circle.r,
      },
      maxBound: {
        x: circle.center.x + circle.r,
        y: circle.center.y + circle.r,
      },
    };
  }
}
