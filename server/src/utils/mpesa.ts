import axios, { AxiosError, AxiosInstance } from 'axios';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const BASE_URL: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

interface AccessTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  CustomerMessage?: string;
}

export interface B2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface C2BSimulationResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseDescription: string;
}

type MetadataMap = Record<string, string | number | undefined>;

function handleAxiosError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ errorMessage?: string }>;
    const details = axiosError.response?.data?.errorMessage || axiosError.message;
    return new Error(`M-Pesa API error: ${details}`);
  }
  return error instanceof Error ? error : new Error('Erro desconhecido ao contactar M-Pesa');
}

function buildTimestamp(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function buildPassword(timestamp: string): string {
  const raw = `${env.mpesa.shortcode}${env.mpesa.passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

export function normalizeMsisdn(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith(env.mpesa.countryCode)) {
    return digits;
  }
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }
  if (digits.startsWith('0')) {
    return `${env.mpesa.countryCode}${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `${env.mpesa.countryCode}${digits}`;
  }
  return digits;
}

export function formatInternationalMsisdn(phoneNumber: string): string {
  const normalized = normalizeMsisdn(phoneNumber);
  if (!normalized) return '';
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

export type MpesaPaymentRequest = {
  amount: number;
  phoneNumber: string;
  reference: string;
  description?: string;
  callbackUrl: string;
};

export type B2CPayoutRequest = {
  amount: number;
  phoneNumber: string;
  reference: string;
  remarks?: string;
};

export type C2BSimulationRequest = {
  amount: number;
  phoneNumber: string;
  reference: string;
};

class MpesaClient {
  private readonly http: AxiosInstance;
  private accessToken: { value: string; expiresAt: number } | null = null;
  private securityCredential: string | null = null;

  constructor(private readonly config = env.mpesa) {
    this.http = axios.create({
      baseURL: BASE_URL[this.config.environment],
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  private get oauthUrl(): string {
    return `${BASE_URL[this.config.environment]}/oauth/v1/generate?grant_type=client_credentials`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.value;
    }

    const credentials = `${this.config.consumerKey}:${this.config.consumerSecret}`;
    const basic = Buffer.from(credentials).toString('base64');

    try {
      const response = await axios.get<AccessTokenResponse>(this.oauthUrl, {
        headers: {
          Authorization: `Basic ${basic}`,
        },
      });
      const token = response.data.access_token;
      const expiresInSeconds = Number(response.data.expires_in || 3600);
      this.accessToken = {
        value: token,
        expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 30) * 1000,
      };
      return token;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  private resolveSecurityCredential(): string {
    if (this.securityCredential) {
      return this.securityCredential;
    }

    if (this.config.securityCredential && this.config.securityCredential.trim().length > 0) {
      this.securityCredential = this.config.securityCredential;
      return this.securityCredential;
    }

    if (!this.config.initiatorPassword || !this.config.certificatePath) {
      throw new Error(
        'Configure MPESA_SECURITY_CREDENTIAL ou defina MPESA_INITIATOR_PASSWORD e MPESA_CERTIFICATE_PATH para gerar automaticamente.'
      );
    }

    const certificatePath = path.isAbsolute(this.config.certificatePath)
      ? this.config.certificatePath
      : path.resolve(process.cwd(), this.config.certificatePath);

    if (!fs.existsSync(certificatePath)) {
      throw new Error(`Certificado M-Pesa não encontrado em ${certificatePath}`);
    }

    // O fluxo abaixo replica o comportamento demonstrado no exemplo oficial `mpesa-api-node-main`,
    // onde a credencial de segurança é calculada encriptando a password do iniciador com o certificado público.
    const publicCert = fs.readFileSync(certificatePath, 'utf-8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicCert,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(this.config.initiatorPassword)
    );

    this.securityCredential = encrypted.toString('base64');
    return this.securityCredential;
  }

  private async mpesaPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const token = await this.getAccessToken();

    try {
      const response = await this.http.post<T>(endpoint, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }

  async registerC2BUrls(): Promise<void> {
    if (!this.config.c2bConfirmationUrl || !this.config.c2bValidationUrl) {
      return;
    }

    const body = {
      ShortCode: this.config.shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: this.config.c2bConfirmationUrl,
      ValidationURL: this.config.c2bValidationUrl,
    };

    try {
      await this.mpesaPost('/mpesa/c2b/v1/registerurl', body);
    } catch (error) {
      console.warn('Falha ao registar URLs C2B no M-Pesa:', handleAxiosError(error).message);
    }
  }

  async simulateC2BPayment(payload: C2BSimulationRequest): Promise<C2BSimulationResponse> {
    const msisdn = normalizeMsisdn(payload.phoneNumber);
    if (!msisdn) {
      throw new Error('Número MPesa inválido.');
    }

    const body = {
      ShortCode: this.config.shortcode,
      CommandID: 'CustomerPayBillOnline',
      Amount: payload.amount,
      Msisdn: msisdn,
      BillRefNumber: payload.reference,
    };

    return this.mpesaPost<C2BSimulationResponse>('/mpesa/c2b/v1/simulate', body);
  }

  async initiateSTKPush(payload: MpesaPaymentRequest): Promise<StkPushResponse> {
    const timestamp = buildTimestamp();
    const msisdn = normalizeMsisdn(payload.phoneNumber);
    if (!msisdn) {
      throw new Error('Número MPesa inválido.');
    }

    const body = {
      BusinessShortCode: this.config.shortcode,
      Password: buildPassword(timestamp),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: payload.amount,
      PartyA: msisdn,
      PartyB: this.config.shortcode,
      PhoneNumber: msisdn,
      CallBackURL: payload.callbackUrl,
      AccountReference: payload.reference,
      TransactionDesc: payload.description ?? 'BetPulse top-up',
    };

    return this.mpesaPost<StkPushResponse>('/mpesa/stkpush/v1/processrequest', body);
  }

  async triggerB2CPayout(payload: B2CPayoutRequest): Promise<B2CResponse> {
    const msisdn = normalizeMsisdn(payload.phoneNumber);
    if (!msisdn) {
      throw new Error('Número MPesa inválido para levantamento.');
    }

    const body = {
      InitiatorName: this.config.initiatorName,
      SecurityCredential: this.resolveSecurityCredential(),
      CommandID: 'BusinessPayment',
      Amount: payload.amount,
      PartyA: this.config.shortcode,
      PartyB: msisdn,
      Remarks: payload.remarks ?? 'BetPulse withdrawal',
      QueueTimeOutURL: this.config.b2cQueueTimeoutUrl,
      ResultURL: this.config.b2cResultUrl,
      Occasion: payload.reference,
    };

    return this.mpesaPost<B2CResponse>('/mpesa/b2c/v1/paymentrequest', body);
  }

  async bootstrap(): Promise<void> {
    try {
      await this.registerC2BUrls();
    } catch (error) {
      console.warn('Integração M-Pesa inicial não concluída:', error);
    }
  }
}

const mpesaClient = new MpesaClient();

export async function initiateSTKPush(payload: MpesaPaymentRequest): Promise<StkPushResponse> {
  return mpesaClient.initiateSTKPush(payload);
}

export async function triggerB2CPayout(payload: B2CPayoutRequest): Promise<B2CResponse> {
  return mpesaClient.triggerB2CPayout(payload);
}

export async function registerC2BUrls(): Promise<void> {
  await mpesaClient.registerC2BUrls();
}

export async function simulateC2BPayment(payload: C2BSimulationRequest): Promise<C2BSimulationResponse> {
  return mpesaClient.simulateC2BPayment(payload);
}

export async function bootstrapMpesaIntegration(): Promise<void> {
  await mpesaClient.bootstrap();
}

export function extractMetadata(items?: { Name: string; Value?: string | number }[]): MetadataMap {
  if (!items) return {};
  return items.reduce<MetadataMap>((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});
}
