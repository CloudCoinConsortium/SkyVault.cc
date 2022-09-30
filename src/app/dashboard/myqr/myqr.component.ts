import { Component, OnDestroy, OnInit, VERSION } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from 'ngx-qrcode2';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-myqr',
  templateUrl: './myqr.component.html',
  styleUrls: ['./myqr.component.scss']
})
export class MyqrComponent implements OnInit, OnDestroy {

  errorMessage: string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_loading.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  showNormal = true;
  showError = false;
  mySkyVault: string = null;
  balanceBreakup: string = null;
  opinions = 0;
  loadingMessage = '';

  title = 'QRCode';
  name = 'QRCode' + VERSION.major;
  elementType = NgxQrcodeElementTypes.URL;
  correctionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  value = 'https://skyvault.cc/transfer';
  watch:any;
  watchIndicator:any;

  constructor(private auth: LoginService, private router: Router, private indc: IndicatorService) {
    if (localStorage.getItem('skyvault')) {
      this.mySkyVault = localStorage.getItem('skyvault');
    }
    this.value = window.location.origin + '/transfer/' + this.mySkyVault;
  }

  ngOnInit(): void {
    localStorage.setItem('job', '0');
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['/welcome']);
    }
    this.watch = this.auth.watch().subscribe((value) => {
      if (!value) {
        this.router.navigate(['/welcome']);
      }
    });
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length == 0) {
        this.showLoading(true);
        this.loadingMessage = 'Contacting RAIDA...';
      }
      else{
        this.showLoading(false);
      }
    });

    if (localStorage.getItem('skyvault')) {
      this.mySkyVault = localStorage.getItem('skyvault');
    }
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showLoading(state): void {
    this.loadingMessage = '';
    if (state) {
      this.showNormal = false;
      this.showLoader = true;
      this.showError = false;
    } else {
      this.showNormal = true;
      this.showLoader = false;
      this.showError = false;
    }
  }

  showErrorMessage(message): void {
    this.errorMessage = message;
    this.showNormal = false;
    this.showError = true;
    this.showLoader = false;
  }

  hideErrorMessage(): void {
    this.errorMessage = '';
    this.showNormal = true;
    this.showError = false;
    this.showLoader = false;
  }

}
