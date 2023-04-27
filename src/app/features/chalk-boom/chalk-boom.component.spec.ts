import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChalkBoomComponent } from './chalk-boom.component';

describe('ChalkBoomComponent', () => {
  let component: ChalkBoomComponent;
  let fixture: ComponentFixture<ChalkBoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChalkBoomComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChalkBoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
