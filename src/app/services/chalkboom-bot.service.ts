import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { delay, filter, retryWhen, switchMap, tap, withLatestFrom } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

interface BotStatus {
  ws: WebSocketSubject<IrcMessage | IrcEvent | ToIrcMessage> | null;
  connected: boolean;
  connecting: boolean;
  lastBoom: IrcMessage | null;
  lastMe: IrcMessage | null;
}
/*

*/

interface ToIrcMessage {
  irc_channel: string;
  message: string;
}

interface IrcData {
  command: string;
  'message-text': string;
  params: Array<String>;
  prefix: string;
  raw: string;
  tags: IrcTags;
}

interface EmoteData {
  id: string;
  positions: Array<[number, number]>;
}

interface IrcTags {
  'badge-info': string;
  badges: string;
  'client-nonce': string;
  color: string;
  'display-name': string;
  emotes: EmoteData;
  'first-msg': string;
  flags: string;
  id: string;
  mod: string;
  'returning-chatter': string;
  'room-id': string;
  subscriber: string;
  'tmi-sent-ts': string;
  turbo: string;
  'user-id': string;
  'user-type': string;
}

export interface IrcMessage {
  data: IrcData;
  irc_username: string;
}

interface IrcEvent {
  event: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChalkboomBotService extends ComponentStore<BotStatus> {
  readonly ws$ = this.select((s) => s.ws);
  readonly lastBoom$ = this.select((s) => s.lastBoom);
  readonly lastMe$ = this.select((s) => s.lastMe);

  constructor() {
    super({
      ws: null,
      connected: false,
      connecting: false,
      lastBoom: null,
      lastMe: null,
    });

    this.prepareWebSocket(
      environment.tauUrl.replace('http', 'ws'),
      environment.botName,
      environment.tauToken
    );

    this.handleWsConnection(this.ws$);
  }

  readonly disconnect = this.effect((trigger$) =>
    trigger$.pipe(
      withLatestFrom(this.ws$),
      tap(([, ws]) => {
        if (ws) {
          ws.complete();
        }
        this.patchState({ ws: null });
      })
    )
  );

  readonly handleWsConnection = this.effect<BotStatus['ws']>((ws$) =>
    ws$.pipe(
      filter((ws): ws is Exclude<BotStatus['ws'], null> => ws !== null),
      switchMap((ws) =>
        ws.pipe(
          retryWhen((errors) => {
            console.log(
              'Chatbot disconnected!  Attempting reconnection shortly..'
            );
            return errors.pipe(delay(2000));
          }),
          filter((msg): msg is IrcMessage => !!(msg as any).irc_username),
          filter((msg) => msg.data['message-text'].startsWith('!')),
          tap({
            next: (msg) => {
              if (msg.data) {
                this.handleMessageText(msg);
              }
            },
            finalize: () => {
              this.disconnect();
            },
          })
        )
      )
    )
  );

  handleMessageText(msg: IrcMessage) {
    if (msg.data['message-text'].startsWith('!boom')) {
      this.patchState({
        lastBoom: msg,
      });
    } else if (msg.data['message-text'].startsWith('!me')) {
      this.patchState({
        lastMe: msg,
      });
    }
  }

  private prepareWebSocket(url: string, botName: string, token: string) {
    const endpoint = `${url}/ws/chat-bots/${botName}/`;
    this.patchState({
      ws: webSocket({
        url: endpoint,
        openObserver: {
          next: () => {
            console.log(`connected to websocket at ${endpoint}`);
            this.get((s) => s.ws)?.next({ token: token } as any);
          },
        },
      }),
    });
  }

  sendMessage(channel: string, message: string) {
    console.log(channel, message);
    this.get().ws?.next({ irc_channel: channel, message });
  }
}
