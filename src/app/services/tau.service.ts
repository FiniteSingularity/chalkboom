import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { delay, filter, retryWhen, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ChannelPointRedemptionAdd,
  getTauMessages,
  PredictionProgress,
  TauEvent,
} from 'tau-js-client-forked';
import { PredictionWagers } from '../models/prediction.models';
import { PredictionProgressEventData } from 'tau-js-client-forked/src/lib/events/prediction-progress/prediction-progress-event-data';

const PredictionWagersDefault: PredictionProgressEventData = {
  id: '',
  title: '',
  broadcasterUserId: '',
  broadcasterUserLogin: '',
  broadcasterUserName: '',
  locksAt: new Date(),
  startedAt: new Date(),
  outcomes: [
    {
      title: 'Blue',
      users: 0,
      channelPoints: 0,
      topPredictors: [],
      color: '',
      id: '',
    },
    {
      title: 'Red',
      users: 0,
      channelPoints: 0,
      topPredictors: [],
      color: '',
      id: '',
    },
  ],
};

export interface TauEvents {
  eventsWs: any | null;
  connected: boolean;
  wagers: PredictionProgressEventData;
}

@Injectable({
  providedIn: 'root',
})
export class TauService extends ComponentStore<TauEvents> {
  readonly eventsWs$ = this.select((s) => s.eventsWs);
  readonly wagers$ = this.select((s) => s.wagers);
  constructor(private http: HttpClient) {
    super({
      eventsWs: null,
      connected: true,
      wagers: {
        ...PredictionWagersDefault,
      },
    });
    this.prepareTau();
    this.handleTauEvents(this.eventsWs$);
  }

  readonly handleTauEvents = this.effect<TauEvents['eventsWs']>((ws$) =>
    ws$.pipe(
      filter((ws): ws is Exclude<TauEvents['eventsWs'], null> => ws !== null),
      switchMap((ws) =>
        ws.pipe(
          retryWhen((errors) => {
            console.log('Disconnected.. Attempting to reconnect...');
            console.log(errors);
            return errors.pipe(delay(2000));
          }),
          filter((evt) => evt instanceof PredictionProgress),
          tap({
            next: (message: PredictionProgress) => {
              this.patchState({
                wagers: message.eventData,
              });
            },
          })
        )
      )
    )
  );

  private prepareTau() {
    this.patchState({
      eventsWs: getTauMessages({
        domain: environment.tauUrl.replace('https://', ''),
        port: 443,
        token: environment.tauToken,
        events: true,
      }),
    });
  }

  userDetails(userId: string) {
    const headers = {};
    return this.http.get(
      `https://${environment.tauUrl}/api/twitch/helix/users?id=${userId}`,
      {
        headers: { Authorization: `Token ${environment.tauToken}` },
      }
    );
  }
}
