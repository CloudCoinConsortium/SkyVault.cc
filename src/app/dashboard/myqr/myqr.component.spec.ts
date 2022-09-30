import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyqrComponent } from './myqr.component';

describe('MyqrComponent', () => {
  let component: MyqrComponent;
  let fixture: ComponentFixture<MyqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyqrComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyqrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
