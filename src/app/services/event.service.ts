import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  menuToggleEvent: EventEmitter<object> = new EventEmitter();
  disclaimerMobileCaller: EventEmitter<object> = new EventEmitter();
  supportMobileCaller: EventEmitter<object> = new EventEmitter();

  constructor() { }

  getMenuToggleEvent() {
    return this.menuToggleEvent;
  }

  getDisclaimerMobileCallerEvent() {
    return this.disclaimerMobileCaller;
  }
  getsupportMobileCallerEvent() {
    return this.supportMobileCaller;
  }

  emitMenuToggleEvent(data: any = '') {
    this.menuToggleEvent.emit(data);
  }

  emitDisclaimerMobileCallerEvent(data: any = '') {
    this.disclaimerMobileCaller.emit(data);
  }
  emitSupportMobileCallerEvent(data: any = '') {
    this.supportMobileCaller.emit(data);
  }
}
