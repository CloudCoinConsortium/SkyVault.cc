import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';

@Component({
  selector: 'app-debit-card-details',
  templateUrl: './debit-card-details.component.html',
  styleUrls: ['./debit-card-details.component.scss']
})
export class DebitCardDetailsComponent implements OnInit, OnDestroy, AfterViewInit {

  walletName: string = '';
  cardNumber: string = '';
  expiryDate: string = '';
  cvv2: number = null;
  errorMessage: string = '';
  options: AnimationOptions = {
    path: '/assets/animations/cloud_login.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader:boolean = false;
  showNormal:boolean = true;
  showError:boolean = false;
  loadingMessage:string = null;
  watchIndicator:any;

  @ViewChild('autofocus') autoFocusField: ElementRef;
  ngAfterViewInit(): void {
    // this.autoFocusField.nativeElement.focus();
  }

  constructor(private auth: LoginService, private  router: Router, private skyvault: SkyvaultService, private indc: IndicatorService) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    localStorage.setItem('job', '0');
    if (this.auth.getLoggedIn()) {
      this.router.navigate(['/balance']);
    }
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length == 0) {
        this.options = {
          path: '/assets/animations/cloud_loading.json'
        };
        this.showLoading(true);
        this.loadingMessage = 'Contacting RAIDA...';
      }
      else{
        this.options = {
          path: '/assets/animations/cloud_login.json'
        };
        this.showLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  keyPressNumbers(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  async login() {
    this.loadingMessage = '';
    if (!this.walletName || this.walletName === '')
    {
      this.showErrorMessage('Invalid wallet name');
      return;
    }
    if (!this.cardNumber || this.cardNumber === '')
    {
      this.showErrorMessage('Invalid card number');
      return;
    }
    else
    {
      if (this.cardNumber.replace(' ', '').length !== 16)
      {
        this.showErrorMessage('Invalid card number');
        return;
      }
      else {
        this.cardNumber = this.cardNumber.replace(' ', '');
      }

      if (!this.cvv2 || this.cvv2.toString().length < 4)
      {
        this.showErrorMessage('Invalid PIN');
        return;
      }
      // Everything seems okay now so we can call login
     this.walletName = this.walletName + '.skyvault.cc';
      const params = {
        username : this.walletName,
        cardnumber : this.cardNumber.toString(),
        cvv: this.cvv2.toString()
      };
      this.showLoading(true);
      localStorage.setItem('job', '1');

      // console.log("SKYVAULT: GetCCByCardData params", params);
      let response = await this.skyvault.loginWithCard(params);
      // console.log("SKYVAULT: GetCCByCardData", response);
      if(response) {

        localStorage.setItem('job', '0');
        if (response.status === 'error')
        {
          if (response.errorText.indexOf('Failed to resolve DNS name') !== -1) {
            this.showErrorMessage('Invalid Debit Card Details');
          }
          else
          {
            this.showErrorMessage(response.errorText);
          }
        }
        else {
          if (response.status === 'done')
          {
            const cloudcoin = response.cc;
            if (!cloudcoin.an && cloudcoin.ans) {
              cloudcoin.an = cloudcoin.ans;
            }

            localStorage.setItem('cc', JSON.stringify(cloudcoin));
            localStorage.setItem('skyvault', this.walletName);
            localStorage.setItem('statements', "true");
            this.auth.checkLoginStatus();
            let b4uPay = JSON.parse(localStorage.getItem('b4uPay'));
            let bitmartPay = JSON.parse(localStorage.getItem('bitmartPay'));
            let merchantPay = JSON.parse(localStorage.getItem('merchantPay'));
            let payRoute = JSON.parse(localStorage.getItem('payRoute'));

            // redirect to payment routes if called before login or redirect to balance screen
            if(b4uPay) {
              setTimeout(() => {
                this.router.navigate(['/b4u'], { queryParams: b4uPay });
              }, 2500);
            }
            else if(bitmartPay) {
              setTimeout(() => {
                this.router.navigate(['/bitmart'], { queryParams: bitmartPay });
              }, 2500);
            }
            else if(payRoute){
              setTimeout(() => {
                this.router.navigate([payRoute]);
              }, 2500);
            }
            else if(merchantPay){
              setTimeout(() => {
                this.router.navigate(['/payment'], { queryParams: merchantPay });
              }, 2500);
            }
            else{
              setTimeout(() => {
                this.router.navigate(['/balance']);
              }, 2500);
            }
          }
        }
      }
    }
  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showLoading(state): void {
    if (state)
    {
      this.showNormal = false;
      this.showLoader = true;
      this.showError = false;
    }
    else
    {
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
