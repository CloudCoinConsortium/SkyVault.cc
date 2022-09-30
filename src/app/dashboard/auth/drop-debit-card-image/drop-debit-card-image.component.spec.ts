import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDebitCardImageComponent } from './drop-debit-card-image.component';

describe('DropDebitCardImageComponent', () => {
  let component: DropDebitCardImageComponent;
  let fixture: ComponentFixture<DropDebitCardImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropDebitCardImageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropDebitCardImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
