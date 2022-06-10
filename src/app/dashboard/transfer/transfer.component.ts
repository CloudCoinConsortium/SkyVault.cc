import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { AnimationOptions } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { IndicatorService } from 'src/app/services/indicator.service';
import { round } from 'mathjs'

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss']
})
export class TransferComponent implements OnInit, OnDestroy {

  faInfoCircle = faInfoCircle;
  amount:number = 0;
  memo: string = null;
  to: string = null;
  errorMessage: string = null;
  progressMessage:string = null;
  completeMessage:string = null;
  loadingOptions: AnimationOptions = {
    path: '/assets/animations/cloud_loading.json'
  };
  options: AnimationOptions = {
    path: '/assets/animations/cloud_transfer.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  balanceLoader = false;
  showNormal = true;
  showError = false;
  complete = false;
  public balance = 0;
  public balanceString = '0';
  balanceBreakup: string = null;
  opinions = 0;
  public balances: any = {};
  loadingMessage = '';
  defaultAddress:boolean = false;
  skyvaultAddress: string = null;
  doRecord:boolean = true;
  payRoute:any = null;
  watch:any;
  watchIndicator:any;
  processing:boolean;
  syncCount = 0;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private route:ActivatedRoute, private indc: IndicatorService) {
    this.doRecord = JSON.parse(localStorage.getItem('statements'));
    this.processing = false;
    localStorage.setItem('payRoute', 'null');
    localStorage.removeItem('payRoute');

    let routeParams:any = this.route.snapshot.paramMap;
    let transferID = routeParams.get('transferID');

    if(transferID){
      if (!(transferID.toLowerCase().endsWith('.skyvault.cc'))) {
        this.showErrorMessage('Invalid QR Code Address!');
        return;
      }
      this.progressMessage = '';
      this.defaultAddress = true;
      this.to = transferID;

      let url = window.location.href;
      let origin = window.location.origin;
      this.payRoute = url.split(origin.toString())[1];
      // console.log("payment route: ", this.payRoute);

      if (!this.auth.getLoggedIn()) {
        localStorage.setItem("payRoute", JSON.stringify(this.payRoute));
        this.router.navigate(['/auth/drop-image']);
      }

    }
    else{
      if (!this.auth.getLoggedIn()) {
        this.router.navigate(['/welcome']);
      }
      this.defaultAddress = false;
    }
  }

  ngOnInit(): void {
    this.showLoading(true);
    localStorage.setItem('job', '0');
    this.watch = this.auth.watch().subscribe((value) => {
      if (!value) {
        this.router.navigate(['/welcome']);
      }
    });

    let checked=0;

    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length == 0) {
        this.showLoading(true);
        this.progressMessage = 'Contacting RAIDA...';
      }
      else{
        checked++;
        if(!this.processing && checked==1){
          setTimeout(() => {
            this.showLoading(false);
            this.checkBalance();
          }, 2000);
        }
      }
    });

    if (localStorage.getItem('skyvault')) {
      this.skyvaultAddress = localStorage.getItem('skyvault');
    }
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watch.unsubscribe();
    }
  }

  async checkBalance() {
    // console.log("Checking balance...");
    this.progressMessage = 'Checking current balance';
    this.showLoading(true);
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();

      const params = {
        sn: token.sn,
        an: token.an
      };

      let response = await this.skyvault.showBalance(params);
      // console.log("SKYVAULT: showBalance: ", response);

      if(response) {
        this.balance = 0;
        this.opinions = 0;
        let highestOpinion = 0;
        let highestOpinionBalance = 0;
        this.balanceBreakup = '<div style="text-align: left; display: table;">Your SkyVault is out of sync. Balance returned by RAIDA servers are as follows: <ul style="text-align: left!important;">';

        if (response.balances) {
          this.balances = response.balances;
          for (const key in response.balances) {
            // check if the property/key is defined in the object itself, not in parent
            if (response.balances.hasOwnProperty(key)) {
              // console.log(key, response.balances[key]);
              this.balanceBreakup += '<li style="text-align: left!important">' + response.balances[key] +
                ' RAIDA(s) - ' + parseInt(key).toLocaleString() + ' cc </li>';
              if (response.balances[key] > highestOpinion)
              {
                highestOpinion = response.balances[key];
                highestOpinionBalance = parseInt(key);
                this.balance = highestOpinionBalance;
                this.balanceString = this.balance.toLocaleString();
              }
            }
            this.opinions++;
          }
          // this.balanceBreakup += '</ul> It is advised that you sync your SkyVault by clicking the sync icon</div>';
          this.balanceBreakup += '</ul></div>';

          if (this.opinions > 1 && this.syncCount == 0) {
            this.syncCount++;
            await this.syncAccount();
          }
        }
      }
      this.showLoading(false);
    }
  }

  async syncAccount() {
    this.showLoading(true);
    let completeCallBack = false;

    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();
      this.progressMessage = 'Synchronizing SkyVault';

      const params = {
        sn: token.sn,
        an: token.an
      };

      // console.log("SKYVAULT: apiFixTransfer params: ",params);
      let fixResponse = await this.skyvault.fixCoinsSync(params);
      console.log("SKYVAULT: apiFixTransfer response: ",fixResponse);

      if(fixResponse.status == 'done') {
        if(!completeCallBack) {
          this.checkBalance();
          completeCallBack = true;
        }
      }
      else {
        this.showErrorMessage(fixResponse.errorText);
        return;
      }
    }
  }

  onAmountChange(amt) {
    if(this.amount){
      this.amount = round(this.amount);
    }
  }

  async transfer() {
    this.processing = true;
    if (!this.to || this.to === '' )
    {
      this.showErrorMessage('Please enter a valid recipient SkyVault account');
      return;
    }
    if (isNaN(this.amount) ||  this.amount < 1)
    {
      this.showErrorMessage('Please enter a valid amount');
      return;
    }
    if (this.amount > this.balance)
    {
      this.showErrorMessage('Insufficient balance!');
      return;
    }

    if (this.to.substr(0, 9).toLowerCase() === 'cloudcoin')
    {
      this.showErrorMessage('Transfer option cannot be used to send money to a Merchant SkyVault Account, please use the "Payment" ' +
        'option instead from the menu');
      return;
    }
    if (!this.memo || this.memo === '') {
      this.memo = 'Transfer';
    }

    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    }
    else {
      this.progressMessage = 'Transferring CloudCoins...';
      const token = this.auth.getToken();

      const coin = {
        sn: token.sn,
        an: token.an
      };
      this.amount = round(this.amount);
      const params = {...coin, amount: this.amount, to: this.to, memo : this.memo };
      this.showLoading(true);
      localStorage.setItem('job', '1');

      let response = await this.skyvault.transfer(params);
      console.log("SKYVAULT: transfer response (apiTransfer): ",response);
      if(response) {
        localStorage.setItem('job', '0');
        if (response.status === 'error') {
          if ('errorText' in response) {
            if (response.errorText.indexOf('Failed to resolve') !== -1) {
              this.showErrorMessage('Invalid Recipient SkyVault Address: ' + this.to);
            }
            else
            {
              this.showErrorMessage(response.errorText);
            }
          }
          else {
            this.showErrorMessage('Your login session is not valid, please logout and try again');
          }
          return;
        }

        if (!('result' in response)) {
          this.showErrorMessage('Invalid response received');
          return;
        }

        if(!this.doRecord && response.transaction_id) {
          const token = this.auth.getToken();
          const coin = {
            sn: token.sn,
            an: token.an
          };

          localStorage.setItem('job', '1');

          let param = {
            "coin" : coin,
            "guid" : response.transaction_id
          }
          await this.skyvault.deleteRecords(param);
          this.changeDetectorRef.detectChanges();
          localStorage.setItem('job', '0');
        }

        this.complete = true;
        this.showCompleteMessage("Transfer Complete");
      }
    }
  }

  sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showLoading(state): void {
    if (state) {
      this.showNormal = false;
      this.showLoader = true;
      this.showError = false;
    }
    else {
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

  showCompleteMessage(message): void {
    this.completeMessage = message;
    this.complete = true;
    this.showError = false;
    this.showNormal = false;
    this.showLoader = false;
  }

}
