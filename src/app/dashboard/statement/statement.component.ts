import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import Swal from 'sweetalert2';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-statement',
  templateUrl: './statement.component.html',
  styleUrls: ['./statement.component.scss']
})
export class StatementComponent implements OnInit, OnDestroy {

  showLoader = false;
  showNormal = true;
  showError = false;
  loadingMessage: string = null;
  errorMessage: string = null;
  progressMessage:string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_loading.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  skyvaultAddress: string = null;
  transactions:any;
  updatedTransactions:any;
  doRecord:boolean = true;
  watch:any;
  watchIndicator:any;
  processing:boolean;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private indc: IndicatorService) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.progressMessage = "Fetching statements..";
    this.processing = false;
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
        this.progressMessage = 'Contacting RAIDA...';
      }
      else{
        if(!this.processing){
          this.showLoading(false);
          this.checkStatements();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  checkStatements() {
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {

      this.doRecord = JSON.parse(localStorage.getItem('statements'));

      if(this.doRecord){
          this.getTransactions();
      }
    }
  }

  async getTransactions() {
    this.showLoading(true);
    localStorage.setItem('job', '1');
    this.progressMessage = 'Fetching Statements...';
    this.processing = true;
    const token = this.auth.getToken();
    const coin = {
      sn: token.sn,
      an: token.an
    };

    const ts = {
      "month": 0,
      "day": 0,
      "year": 0
    }
    let trdata = {
      "coin" : coin,
      "start_ts" : ts
    }

    let response = await this.skyvault.statements(trdata);
    console.log("SKYVAULT: apiShowRecords response: ", response);

    localStorage.setItem('job', '0');

    if (response.status == 'error') {
      this.showErrorMessage(response.errorText);
      return;
    }
    else{
      if (response.text == "Records returned") {
        this.transactions = response.records;

        this.updatedTransactions = [];

        this.transactions.forEach(element => {

          let date = '';
          let nd = new Date(element.time[0] + 2000, element.time[1] - 1, element.time[2] , element.time[3] , element.time[4] , element.time[5]);

          if(nd instanceof Date && nd.toString() != 'Invalid Date') {
            let dt = (new Date(nd + ' UTC')).toString();
            date = dt;
          }

          let record = {
            amount : (element.type == 1 || element.type == 3) ? ("- " + element.amount) : ("+ " + element.amount),
            balance : element.balance,
            date : date,
            transaction_type : element.type == 0 ? "Deposit" : (element.type == 1 ? "Withdraw" : ( element.type == 3 ? "Transfer" : "Transfer"))
          }

          this.updatedTransactions.push(record);

        });

        let sorted = this.sortByDateDesc();
        this.updatedTransactions = sorted;
        // console.log('records: UPDATED', this.updatedTransactions);
      }
      else {
        this.showErrorMessage(response.errorText);
      }
    }
    this.showLoading(false);
  }

  sortByDateDesc() {
    return this.updatedTransactions.sort((a: any, b: any) => {
      return <any>new Date(b.date) - <any>new Date(a.date);
    });
  }

  toggleDeleteRecords() {
    this.doRecord = !this.doRecord;
    localStorage.setItem('statements', JSON.stringify(this.doRecord));
    this.progressMessage = '';

    if(this.doRecord){
      this.updatedTransactions = false;
      this.transactions = false;
    }
    else{
      if(this.transactions) {
        Swal.fire({
          titleText: 'Are you sure?',
          text: 'This action will remove all recorded transactions from your account and prevent recording future transactions!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
        }).then(async (result) => {
          if (result.value) {
              //code to delete records
              await this.deleteRecords();
          }
          else{
            this.doRecord = !this.doRecord;
            localStorage.setItem('statements', JSON.stringify(this.doRecord));
          }
        });
      }

    }
  }

  async deleteRecords(){
    this.showLoading(true);
    localStorage.setItem('job', '1');
    this.progressMessage = 'Deleting Statements...';
    const token = this.auth.getToken();
    const coin = {
      sn: token.sn,
      an: token.an
    };

    const param = {
      "coin" : coin
    }

    let response = await this.skyvault.deleteRecords(param);
    localStorage.setItem('job', '0');

    if(response.status === 'error') {
      this.showErrorMessage(response.errorText);
      this.doRecord = true;
      localStorage.setItem('statements', JSON.stringify(this.doRecord));
      return;
    }

    if(response.code == 0){
      this.transactions = null;
      this.updatedTransactions = null;
    }
    this.showLoading(false);
    this.progressMessage = '';
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
}
