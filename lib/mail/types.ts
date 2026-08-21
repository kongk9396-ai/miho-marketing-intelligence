export interface MailAttachmentRef {
  messageId: string;
  attachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface MetaReportSearchCriteria {
  subjectKeywords: string[];
  lookbackHours: number;
  allowedExtensions: string[];
}

export interface MailConnectionTestResult {
  ok: boolean;
  emailAddress?: string;
  error?: string;
}

/**
 * Provider abstraction for "find Meta report emails and download their
 * attachments". Gmail is the first implementation; a future provider (e.g.
 * Outlook) only needs to implement this same interface — nothing else in the
 * sync engine or UI should depend on Gmail specifics.
 */
export interface MailProvider {
  isConnected(): Promise<boolean>;
  testConnection(): Promise<MailConnectionTestResult>;
  findMetaReportEmails(criteria: MetaReportSearchCriteria): Promise<MailAttachmentRef[]>;
  downloadAttachment(ref: MailAttachmentRef): Promise<Buffer>;
}
