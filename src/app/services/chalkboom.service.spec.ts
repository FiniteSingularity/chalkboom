import { TestBed } from '@angular/core/testing';

import { ChalkboomService } from './chalkboom.service';

describe('ChalkboomService', () => {
  let service: ChalkboomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChalkboomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
