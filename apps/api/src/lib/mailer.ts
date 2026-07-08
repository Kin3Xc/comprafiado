import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía correo vía Resend. Sin RESEND_API_KEY (desarrollo) solo
 * registra el contenido en el log.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  if (!resend) {
    logger.info({ to: options.to, subject: options.subject, html: options.html }, 'Correo simulado (RESEND_API_KEY no configurada)');
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    logger.error({ error, to: options.to }, 'Fallo al enviar correo');
    throw new Error('No se pudo enviar el correo');
  }
}
