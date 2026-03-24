import type { StorageClient } from './exportService';

export class AzureBlobStorage implements StorageClient {
  private containerName: string;
  private connectionString: string;

  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
    this.containerName = process.env.AZURE_BLOB_CONTAINER ?? 'exports';
    if (!this.connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
    }
  }

  async uploadAndSign(path: string, data: Buffer | string, contentType: string): Promise<{ url: string; expiresAt: Date }> {
    const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } =
      await import('@azure/storage-blob');

    const client = BlobServiceClient.fromConnectionString(this.connectionString);
    const container = client.getContainerClient(this.containerName);
    await container.createIfNotExists();

    const blob = container.getBlockBlobClient(path);
    const buf = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    await blob.upload(buf, buf.byteLength, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Parse account name + key from connection string for SAS signing
    const accountNameMatch = this.connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = this.connectionString.match(/AccountKey=([^;]+)/);
    if (!accountNameMatch || !accountKeyMatch) throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING');

    const sharedKey = new StorageSharedKeyCredential(accountNameMatch[1], accountKeyMatch[1]);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: path,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn: expiresAt,
      },
      sharedKey,
    ).toString();

    const url = `${blob.url}?${sas}`;
    return { url, expiresAt };
  }
}
