import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IndicatorService {
  obj:any = {};

  private source = new BehaviorSubject<object>(this.obj);
  currentRStatus = this.source.asObservable();

  constructor() { }

  changeRIndicator(rStatus: any) {
    this.source.next(rStatus);
  }
}
