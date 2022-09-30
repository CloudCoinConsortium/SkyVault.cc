import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BitmartComponent } from './bitmart.component';

describe('BitmartComponent', () => {
  let component: BitmartComponent;
  let fixture: ComponentFixture<BitmartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BitmartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BitmartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
