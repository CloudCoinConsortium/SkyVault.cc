import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';

@Component({
  selector: 'app-drop-debit-card-image',
  templateUrl: './drop-debit-card-image.component.html',
  styleUrls: ['./drop-debit-card-image.component.scss']
})
export class DropDebitCardImageComponent implements OnInit, OnDestroy {

  files: File[] = [];
  errorMessage: string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_login.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  showNormal = true;
  showError = false;
  loadingMessage:string = null;
  watchIndicator:any;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private indc: IndicatorService) {
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
        this.loadingMessage = '';
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  onSelect(event: any) {
		this.files.push(...event.addedFiles);
    let total = event.addedFiles.length - 1;
    if(this.files.length > 1){ // checking if files array has more than one content
      this.files.splice(0,total); // index =0 , remove_count = total
    }
    // console.log('file:', this.files);

    setTimeout(() => {
      this.getBase64(event);
    }, 1000);
	}

	onRemove(event: any) {
		this.files.splice(this.files.indexOf(event), 1);
	}

  getBase64(event) {
    const me = this;
    const file = event.addedFiles[0];
    const reader = new FileReader();
    let alias = file.name;
    const walletName = alias.replace(/\.png$/, '');
    if (!(walletName.toLowerCase().endsWith('.skyvault.cc'))) {
      this.showErrorMessage('Invalid SkyVault account');
      return;
    }
    reader.readAsDataURL(file);
    reader.onload = async function() {
      const params = {
        template: reader.result
      };

      me.showLoading(true);
      localStorage.setItem('job', '1');
      let response = await me.skyvault.loginWithCardImage(params);
      // console.log("SKYVAULT: extractStack", response);
      if(response) {
        localStorage.setItem('job', '0');
        if (response.status === 'error')
        {
          if(response.errorText.indexOf('PNG signature'))
          {
            me.showErrorMessage('The dropped Pass Key is not valid. Please ensure you are using the original unmodified Pass Key, which can be modified if shared via messaging/file sharing apps.');
          }
          else
          {
            me.showErrorMessage(response.errorText);
          }
        }
        else {
          if (response.status === 'done' && response.cloudcoin !== null && response.cloudcoin.length > 0)
          {

            const cloudcoin = response.cloudcoin[0];

            localStorage.setItem('cc', JSON.stringify(cloudcoin));
            localStorage.setItem('skyvault',walletName);
            localStorage.setItem('statements', "true");
            me.auth.checkLoginStatus();
            let b4uPay = JSON.parse(localStorage.getItem('b4uPay'));
            let bitmartPay = JSON.parse(localStorage.getItem('bitmartPay'));
            let merchantPay = JSON.parse(localStorage.getItem('merchantPay'));
            let payRoute = JSON.parse(localStorage.getItem('payRoute'));

            // redirect to payment routes if called before login or redirect to balance screen
            if(b4uPay) {
              setTimeout(() => {
                me.router.navigate(['/b4u'], { queryParams: b4uPay });
              }, 2500);
            }
            else if(bitmartPay) {
              setTimeout(() => {
                me.router.navigate(['/bitmart'], { queryParams: bitmartPay });
              }, 2500);
            }
            else if(payRoute){
              setTimeout(() => {
                me.router.navigate([payRoute]);
              }, 2500);
            }
            else if(merchantPay){
              setTimeout(() => {
                me.router.navigate(['/payment'], { queryParams: merchantPay });
              }, 2500);
            }
            else{
              setTimeout(() => {
                me.router.navigate(['/balance']);
              }, 2500);
            }
          }
        }
      };

    };
    reader.onerror = function(error) {
      console.log('Error: ', error);
      me.showErrorMessage('Error reading Card Image');
    };
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
