import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

declare var $: any;
declare var SkyVaultJS: any;
SkyVaultJS = SkyVaultJS || {};

@Injectable({
  providedIn: 'root'
})
export class SkyvaultService {

  options: any = {
    domain: 'cloudcoin.global',
    prefix: 'raida',
    protocol: 'https',
    timeout: 30000,
    defaultCoinNn: 1,
    debug: true,
    defaultRaidaForQuery: 7,
    maxFailedRaidas: 5,
    maxCoinsPerIteraiton: 200,
    maxCoins: 16000,
    maxSendCoins: 3200,
    nexttimeout: 10000,
    wsprotocol: "wss"
  };

  public skyvaultJS = null;

  constructor(private http: HttpClient) {
    this.setProtocols();
  }

  setProtocols() {
    if(window.location.protocol === 'http:') {
      this.options.wsprotocol = 'ws';
    }
    this.skyvaultJS = new SkyVaultJS(this.options);
    this.skyvaultJS.setTimeout(15000);
  }

  set(keys, value): string {
    const key = CryptoJS.enc.Utf8.parse(keys);
    const iv = CryptoJS.enc.Utf8.parse(keys);
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value.toString()), key,
      {
        keySize: 128 / 8,
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
    return encrypted.toString();
  }

  // The get method is use to decrypt the value.
  get(keys, value): string {
    const key = CryptoJS.enc.Utf8.parse(keys);
    const iv = CryptoJS.enc.Utf8.parse(keys);
    const decrypted = CryptoJS.AES.decrypt(value, key, {
      keySize: 128 / 8,
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  generateSeed(): any {
    return this.skyvaultJS._generatePan().substring(0, 32);
  }

  generatePan(): any[] {
    return this.skyvaultJS._generatePan();
  }

  newpanGenerate(params): any[] {
    const sn = params.sn;
    const cardNumber = params.cardnumber;
    const cvv = params.cvv;
    const part = cardNumber.substring(3, cardNumber.length - 1);
    const ans = [];
    for (let i = 0; i < 25; i++) {
      const seed = '' + i + sn + part + cvv;
      ans[i] = {server: i, serverKey: '' + CryptoJS.MD5(seed)};
    }
    return ans;
  }

  getServers() {
    return this.skyvaultJS.getServers();
  }

  getDenomination(serial): number{
    // return this.skyvaultJS.getDenomination(serial);
    return 1
  }

  async getServerEchoResponse() {
    this.skyvaultJS.setTimeout(5000);
    return await this.skyvaultJS.apiEcho();
  }

  async hostnameCheck(data) {
    return await this.skyvaultJS.apiResolveSkyWallet(data);
  }
  async resolveDNS(data) {
    return await this.skyvaultJS._resolveDNS(data);
  }

  async showBalance(data){
    this.skyvaultJS.setTimeout(5000);
    return await this.skyvaultJS.apiShowBalance(data);
  }

  async detect(data){
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiDetect(data);
  }

  async fixFracked(params) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiFixfracked(params);
  }

  async loginWithCard(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiGetCCByCardData(data);
  }

  async loginWithCardImage(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.extractStack(data);
  }

  async getFreeCoin(sn, an) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiGetFreeCoin(sn, an);
  }

  async embedInImage(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.embedInImage(data);
  }

  async register(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiRegisterSkyWallet(data);
  }

  async deposit(params) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiSend(params);
  }

  async receive(params){
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiReceive(params);
  }

  async statements(data){
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiShowRecords(data,() => {});
  }

  async deleteRecords(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiDeleteRecord(data);
  }

  async showCoins(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiShowCoins(data);
  }

  async fixCoinsSync(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiFixTransferSync(data);
  }

  async fixCoins(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.apiFixTransfer(data);
  }

  async transfer(data) {
    this.skyvaultJS.setTimeout(20000); //max 16000 coins transfer
    return await this.skyvaultJS.apiTransfer(data);
  }

  async extractPng(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.extractStack(data);
  }

  async payment(data) {
    this.skyvaultJS.setTimeout(20000); //max 16000 coins transfer
    return await this.skyvaultJS.apiPay(data);
  }

  async extractCC(data) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS.readCCFile(data);
  }

  async syncOwnersAddDelete(coin, sns, servers, mode) {
    this.skyvaultJS.setTimeout(15000);
    return await this.skyvaultJS._syncOwnersAddDelete(coin, sns, servers, mode);
  }
}
