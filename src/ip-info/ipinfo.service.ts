import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import IPinfoWrapper from 'node-ipinfo';

const exponentList = {
  AED: '2',
  ALL: '2',
  AMD: '2',
  ARS: '2',
  AUD: '2',
  AWG: '2',
  AZN: '2',
  BAM: '2',
  BBD: '2',
  BDT: '2',
  BGN: '2',
  BHD: '3',
  BIF: '0',
  BMD: '2',
  BND: '2',
  BOB: '2',
  BRL: '2',
  BSD: '2',
  BTN: '2',
  BWP: '2',
  BZD: '2',
  CAD: '2',
  CHF: '2',
  CLP: '0',
  CNY: '2',
  COP: '2',
  CRC: '2',
  CUP: '2',
  CVE: '2',
  CZK: '2',
  DJF: '0',
  DKK: '2',
  DOP: '2',
  DZD: '2',
  EGP: '2',
  ETB: '2',
  EUR: '2',
  FJD: '2',
  GBP: '2',
  GHS: '2',
  GIP: '2',
  GMD: '2',
  GNF: '0',
  GTQ: '2',
  GYD: '2',
  HKD: '2',
  HNL: '2',
  HRK: 2,
  HTG: '2',
  HUF: '2',
  IDR: '2',
  ILS: '2',
  INR: '2',
  IQD: '3',
  ISK: '0',
  JMD: '2',
  JOD: '3',
  JPY: '0',
  KES: '2',
  KGS: '2',
  KHR: '2',
  KMF: '0',
  KRW: '0',
  KWD: '3',
  KYD: '2',
  KZT: '2',
  LAK: '2',
  LKR: '2',
  LRD: '2',
  LSL: '2',
  MAD: '2',
  MDL: '2',
  MGA: '2',
  MKD: '2',
  MMK: '2',
  MNT: '2',
  MOP: '2',
  MUR: '2',
  MVR: '2',
  MWK: '2',
  MXN: '2',
  MYR: '2',
  MZN: '2',
  NAD: '2',
  NGN: '2',
  NIO: '2',
  NOK: '2',
  NPR: '2',
  NZD: '2',
  OMR: '3',
  PEN: '2',
  PGK: '2',
  PHP: '2',
  PKR: '2',
  PLN: '2',
  PYG: '0',
  QAR: '2',
  RON: '2',
  RSD: '2',
  RUB: '2',
  RWF: '0',
  SAR: '2',
  SCR: '2',
  SEK: '2',
  SGD: '2',
  SLL: '2',
  SOS: '2',
  SSP: '2',
  SVC: '2',
  SZL: '2',
  THB: '2',
  TND: '3',
  TRY: '2',
  TTD: '2',
  TWD: '2',
  TZS: '2',
  UAH: '2',
  UGX: '0',
  USD: '2',
  UYU: '2',
  UZS: '2',
  VND: '0',
  VUV: '0',
  XAF: '0',
  XCD: '2',
  XOF: '0',
  XPF: '0',
  YER: '2',
  ZAR: '2',
  ZMW: '2',
};

@Injectable()
export class IpInfoService {
  private readonly wrapper: IPinfoWrapper;
  private logger: Logger = new Logger(IpInfoService.name);

  constructor(private config: ConfigService) {
    this.wrapper = new IPinfoWrapper(config.get('IP_INFO_TOKEN'));
  }

  async getInfo(ipAddr: string) {
    try {
      const info = await this.wrapper.lookupIp(ipAddr);
      console.log(info);
      return info;
    } catch (err) {
      this.logger.log(err);
      throw new Error('Failed to get ip info');
    }
  }

  async getExchangeRate(
    baseCurrency: string,
    currency: string,
  ): Promise<number> {
    if (baseCurrency == currency) return 1;
    const apiUrl = this.config.get('EXCHANGE_RATE_API');
    const response = await axios.get(
      `${apiUrl}currencies=${currency}&base_currency=${baseCurrency}`,
    );

    if (response.status != 200) throw new Error('Failed to get exchange rate');

    const exchangeRate = response.data.data[currency];
    return Number(exchangeRate) * 2;
  }

  async getRegionalPricing(
    basePrice: number,
    baseCurrency: string,
    ipAddr: string,
  ) {
    try {
      const ip =
        this.config.get('NODE_ENV') == 'development'
          ? this.config.get('DEV_IP') || ipAddr
          : ipAddr;
      const ipInfo = await this.getInfo(ip);

      const currencyCode = ipInfo.countryCurrency.code;

      const exchangeRate = await this.getExchangeRate(
        baseCurrency,
        currencyCode,
      );

      const exponent = Number(exponentList[currencyCode]);

      const adjustedPrice = Math.floor(
        basePrice * Math.pow(10, exponent) * exchangeRate,
      );

      return {
        currency: ipInfo.countryCurrency,
        country: ipInfo.country,
        adjustedPrice,
        exponent,
      };
    } catch (err) {
      this.logger.log(err);
      throw err;
    }
  }
}
