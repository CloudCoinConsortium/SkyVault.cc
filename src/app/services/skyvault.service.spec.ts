import { TestBed } from '@angular/core/testing';

import { SkyvaultService } from './skyvault.service';

describe('SkyvaultService', () => {
  let service: SkyvaultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkyvaultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
