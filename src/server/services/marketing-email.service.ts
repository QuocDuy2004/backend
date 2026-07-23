import nodemailer from 'nodemailer';
import { findSettingByKey } from './settings.service';

const SMTP_SETTING_KEY = 'marketing_smtp_config';

type SmtpConfig = {
  host?: string;
  port?: number | string;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
};

type SendMarketingEmailPayload = {
  smtp?: SmtpConfig;
  recipients?: unknown;
  subject?: unknown;
  content?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeRecipients(value: unknown) {
  const raw = Array.isArray(value) ? value.join(',') : String(value || '');
  const recipients = Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter(Boolean)
    )
  );

  return recipients.filter((email) => emailPattern.test(email));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(content: string) {
  return escapeHtml(content).replace(/\r?\n/g, '<br>');
}

function buildFromAddress(config: Required<Pick<SmtpConfig, 'fromEmail'>> & SmtpConfig) {
  const fromName = String(config.fromName || '').trim();
  const fromEmail = String(config.fromEmail || '').trim();
  return fromName ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>` : fromEmail;
}

export async function sendMarketingEmail(payload: SendMarketingEmailPayload) {
  const savedSetting = await findSettingByKey(SMTP_SETTING_KEY);
  const savedConfig = asObject(savedSetting?.value) as SmtpConfig;
  const inputConfig = asObject(payload.smtp) as SmtpConfig;
  const smtpConfig = { ...savedConfig, ...inputConfig };

  const host = String(smtpConfig.host || '').trim();
  const port = Number(smtpConfig.port || 587);
  const username = String(smtpConfig.username || '').trim();
  const password = String(smtpConfig.password || '');
  const fromEmail = String(smtpConfig.fromEmail || username || '').trim();
  const fromName = String(smtpConfig.fromName || 'Velocart').trim();
  const secure = Boolean(smtpConfig.secure);
  const subject = String(payload.subject || '').trim();
  const content = String(payload.content || '').trim();
  const recipients = normalizeRecipients(payload.recipients);

  if (!host) throw new Error('Vui lòng cấu hình SMTP host.');
  if (!Number.isFinite(port) || port < 1) throw new Error('Cổng SMTP không hợp lệ.');
  if (!fromEmail || !emailPattern.test(fromEmail)) throw new Error('Email người gửi không hợp lệ.');
  if (!subject) throw new Error('Vui lòng nhập tiêu đề email khuyến mãi.');
  if (!content) throw new Error('Vui lòng nhập nội dung chương trình khuyến mãi.');
  if (recipients.length === 0) throw new Error('Vui lòng nhập ít nhất một email người nhận hợp lệ.');
  if (recipients.length > 500) throw new Error('Mỗi lần gửi tối đa 500 email.');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: username ? { user: username, pass: password } : undefined,
  });

  const result = await transporter.sendMail({
    from: buildFromAddress({ ...smtpConfig, fromEmail, fromName }),
    to: fromEmail,
    bcc: recipients,
    subject,
    text: content,
    html: buildHtml(content),
  });

  const accepted = (result.accepted || []).map(String);
  const rejected = (result.rejected || []).map(String);
  const acceptedSet = new Set(accepted.map((email) => email.toLowerCase()));
  const rejectedSet = new Set(rejected.map((email) => email.toLowerCase()));
  const acceptedRecipients = recipients.filter((email) => acceptedSet.has(email.toLowerCase()));
  const rejectedRecipients = recipients.filter((email) => rejectedSet.has(email.toLowerCase()));

  return {
    messageId: result.messageId,
    accepted: acceptedRecipients,
    rejected: rejectedRecipients,
    sent: acceptedRecipients.length,
    failed: rejectedRecipients.length,
    recipients: recipients.length,
  };
}
