import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import * as CryptoJS from 'crypto-js';
import { SkyvaultService } from 'src/app/services/skyvault.service';

@Component({
  selector: 'app-passkey',
  templateUrl: './passkey.component.html',
  styleUrls: ['./passkey.component.scss']
})
export class PasskeyComponent implements OnInit, OnDestroy {

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
  loadingMessage = '';
  watch:any;
  watchIndicator:any;
  cardImage: string = null;
  cardImageBlank: string = null;
  walletName: any;
  cardData:any;
  registerParams: any = null;

  constructor(private auth: LoginService, private router: Router, private indc: IndicatorService, private skyvault: SkyvaultService) {
    if (localStorage.getItem('skyvault')) {
      this.mySkyVault = localStorage.getItem('skyvault');
      this.walletName = this.mySkyVault;
    }

  }


  ngOnInit(): void {
    localStorage.setItem('job', '0');
    // this.showLoading(true);
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
        // this.showLoading(false);
        this.generatePassKey();
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

  generatePassKey() :any {
    const token = this.auth.getToken();
    if(token) {
      let ccCardData = this.getCardData(token.sn);
      if ((ccCardData as any).status === 'done') {
        const cardGenerated = this.makeCard((ccCardData as any).rand);
        const cardNumber = cardGenerated.number;
        const cvv = (ccCardData as any).cvv;
        const pans = (ccCardData as any).pans;
        const snString = token.sn;
        this.showLoading(true);
        this.loadingMessage = 'Generating Pass Key..';
        const ip = '1.' + ((parseInt(snString) >> 16) & 0xff) + '.' + ((parseInt(snString) >> 8) & 0xff) + '.'
          + ((parseInt(snString)) & 0xff);
        this.cardData = {
          name: this.walletName,
          number: cardNumber,
          expiry: cardGenerated.expiry,
          pin: cvv,
          ip
        };
        this.registerParams = {
          name: this.walletName,
          coin: {
            sn: snString,
            an: pans
          }
        };
        this.addTextToImage('assets/images/passkey.png', this.cardData);
      }
      else {
        this.showErrorMessage('Error generating pass key.');
        localStorage.setItem('job', '0');
        return;
      }
    }
    else {
      this.showErrorMessage('Error generating pass key. Please re-login and try again.');
      localStorage.setItem('job', '0');
      return;
    }
  }

  getCardData(sn): any {
    let finalStr = "";
    let tStr = "" + CryptoJS.MD5(this.walletName);
    let tChars = tStr.split('');

    for (let c = 0; c < tChars.length; c++) {
      let cs = parseInt(tChars[c], 16);
      finalStr += cs;
    }

    // Generating rand and pin from the walletName
    let rand = finalStr.slice(0, 12);
    let pin = finalStr.slice(12, 16);

    let data = this.makeCard(rand);       //{ "number": "4011109610821355", "expiry": "2-27" }
    let num = data.number;                // 4011109610821355

    let part = num.substring(3, num.length - 1);     // 110961082135

    let pans = [];
    for (let i = 0; i < 25; i++) {
      let seed = "" + i + sn + part + pin;
      pans[i] = "" + CryptoJS.MD5(seed);
    }

    let grv = {
      "status": "done",
      "pans" : pans,
      "rand" : rand,
      "cvv" : pin
    };

    return grv;
  }

  makeCard(rand): any {
    const precardNumber = '401' + rand;
    const reverse = precardNumber.split('').reverse().join('');

    let total = 0;
    for (let i = 0; i < reverse.length; i++) {
      let num = parseInt(reverse.charAt(i));
      if ((i + 3) % 2) {
        num *= 2;
        if (num > 9) {
          num -= 9;
        }
      }
      total += num;
    }

    let remainder = 10 - (total % 10);
    if (remainder === 10) {
      remainder = 0;
    }

    const cardNumber = precardNumber + remainder;
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

    const month = fiveYearsFromNow.getMonth() + 1;
    const year = fiveYearsFromNow.getFullYear().toString().substr(-2);
    return { number: cardNumber, expiry: month + '-' + year };
  }

  addTextToImage(imagePath, cardData) {
    const card_canvas = document.createElement('canvas');
    card_canvas.setAttribute('width', '700');
    card_canvas.setAttribute('height', '906');
    const context = card_canvas.getContext('2d');
    const me = this;
    // Draw Image function
    const img = new Image();
    img.src = imagePath;
    img.onload = function() {
      context.drawImage(img, 0, 0);
      context.lineWidth = 0;
      context.fillStyle = '#FFFFFF';
      context.font = '30px sans-serif';
      context.fillText(cardData.name, 50, 400);
      context.font = '40px sans-serif';
      context.fillText(cardData.number.replace(/(.{4})/g, '$1 '), 50, 300);
      context.font = '18px sans-serif';
      context.fillText('Keep these numbers secret, do not give to merchants', 50, 325);
      context.font = '18px sans-serif';
      context.fillText('Share this name with others for receiving payments', 50, 425);

      context.font = '25px sans-serif';
      // context.fillText(cardData.expiry, 450, 355);
      context.fillText('0-0', 450, 355);
      context.fillStyle = '#000000';
      context.fillText('CVV (keep secret): ' + cardData.pin, 50, 675);
      context.fillStyle = '#ffffff';
      context.fillText( 'IP ' + String(cardData.ip), 230, 738);

      me.cardImageBlank = card_canvas.toDataURL(); // 'data:image/png;base64,' + coinResponse;
      me.generateCard();
    };
  }

  async generateCard() {
    // if correct coin
    const coinParam = {
      coins: [{
        sn: parseInt(this.registerParams.coin.sn),
        nn: 1,
        an: this.registerParams.coin.an
      }],
      template: this.cardImageBlank,
      isid: true
    };

    try {
      let coinResponse = await this.skyvault.embedInImage(coinParam);

      if (coinResponse.status && coinResponse.status === 'error') {
        this.showErrorMessage(coinResponse.errorText);
        localStorage.setItem('job', '0');
      }
      else {
        this.showLoading(false);
        this.cardImage = 'data:image/png;base64,' + coinResponse;
      }
    } catch (e) {
      console.log(e);
    }
  }

  downloadImage(): void {
    const a = document.createElement('a'); // Create <a>
    a.href = this.cardImage; // Image Base64 Goes here
    a.download = this.walletName + '.png'; // File name Here
    a.click();
  }

}
