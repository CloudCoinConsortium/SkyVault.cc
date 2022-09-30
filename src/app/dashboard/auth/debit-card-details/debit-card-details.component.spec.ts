import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitCardDetailsComponent } from './debit-card-details.component';

describe('DebitCardDetailsComponent', () => {
  let component: DebitCardDetailsComponent;
  let fixture: ComponentFixture<DebitCardDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DebitCardDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DebitCardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
