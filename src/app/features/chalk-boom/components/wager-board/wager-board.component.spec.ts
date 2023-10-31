import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WagerBoardComponent } from './wager-board.component';

describe('WagerBoardComponent', () => {
  let component: WagerBoardComponent;
  let fixture: ComponentFixture<WagerBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WagerBoardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WagerBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
