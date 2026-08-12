import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import {
  IMailProvider,
  SendEmailOptions,
  SendTemplateEmailOptions,
} from '../mail.interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const handlebars = require('handlebars');

@Injectable()
export class MailgunService implements IMailProvider {
  private mgClient: ReturnType<Mailgun['client']>;
  private templateCache = new Map<string, any>();

  constructor(private readonly configService: ConfigService) {
    const mailgun = new Mailgun(FormData);
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY') || '';

    this.mgClient = mailgun.client({
      username: 'api',
      key: apiKey,
    });
  }

  async sendEmail(options: SendEmailOptions) {
    const domain = this.configService.get<string>('MAILGUN_DOMAIN', '');
    const from = this.configService.get<string>(
      'MAILGUN_FROM',
      'No Reply <noreply@example.com>',
    );

    const messageData: any = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    if (options.html) {
      messageData.html = options.html;
    }
    if (options.text) {
      messageData.text = options.text;
    }

    return this.mgClient.messages.create(domain, messageData);
  }

  async sendTemplateEmail(options: SendTemplateEmailOptions) {
    const html = this.renderTemplate(options.template, options.context);
    return this.sendEmail({
      to: options.to,
      subject: options.subject,
      html,
    });
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    let compiled = this.templateCache.get(templateName);
    if (!compiled) {
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        `${templateName}.hbs`,
      );
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      compiled = handlebars.compile(templateSource);
      this.templateCache.set(templateName, compiled);
    }
    return compiled(context);
  }
}
