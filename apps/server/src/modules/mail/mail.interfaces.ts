export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface SendTemplateEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface IMailProvider {
  sendEmail(options: SendEmailOptions): Promise<any>;
  sendTemplateEmail(options: SendTemplateEmailOptions): Promise<any>;
}

export const MAIL_PROVIDER = 'MAIL_PROVIDER';
