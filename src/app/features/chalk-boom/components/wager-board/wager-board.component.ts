import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  PredictionWagers,
  PredictionWagersOutcome,
} from 'src/app/models/prediction.models';
import {
  PredictionProgressEventData,
  Outcome,
} from 'tau-js-client-forked/src/lib/events/prediction-progress/prediction-progress-event-data';

@Component({
  selector: 'app-wager-board',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './wager-board.component.html',
  styleUrls: ['./wager-board.component.scss'],
})
export class WagerBoardComponent implements OnChanges {
  @Input() wagers!: PredictionProgressEventData | null;

  blue: Outcome | null = null;
  red: Outcome | null = null;
  ngOnChanges(changes: SimpleChanges): void {
    this.blue =
      this.wagers?.outcomes.find((outcome) => outcome.title === 'Blue') ?? null;
    this.red =
      this.wagers?.outcomes.find((outcome) => outcome.title === 'Red') ?? null;
  }
}
