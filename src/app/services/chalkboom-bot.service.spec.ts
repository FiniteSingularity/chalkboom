import { TestBed } from '@angular/core/testing';

import { ChalkboomBotService } from './chalkboom-bot.service';

describe('ChalkboomBotService', () => {
  let service: ChalkboomBotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChalkboomBotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
