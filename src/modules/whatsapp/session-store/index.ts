import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Model } from 'mongoose';
import { AdminDocument } from '../../admin/schemas';

type RemoteAuthStorePayload = {
  session: string;
  path?: string;
};

type StoredWhatsappSession = {
  sessionName: string;
  archive: Buffer;
  savedAt: Date;
};

export class AdminMongoRemoteAuthStore {
  constructor(
    private readonly adminModel: Model<AdminDocument>,
    private readonly dataPath = path.resolve(process.cwd(), '.wwebjs_auth'),
  ) {}

  async sessionExists({ session }: RemoteAuthStorePayload): Promise<boolean> {
    const hostId = this.hostIdFromSession(session);
    const admin = await this.adminModel.findById(hostId).select('whatsappSession').lean().exec();
    return Boolean(admin?.whatsappSession);
  }

  async save({ session }: RemoteAuthStorePayload): Promise<void> {
    const hostId = this.hostIdFromSession(session);
    const archivePath = this.archivePath(session);
    const archive = await fs.readFile(archivePath);
    const whatsappSession: StoredWhatsappSession = {
      sessionName: session,
      archive,
      savedAt: new Date(),
    };

    await this.adminModel.findByIdAndUpdate(hostId, { whatsappSession }).exec();
  }

  async extract({ session, path }: RemoteAuthStorePayload): Promise<void> {
    const hostId = this.hostIdFromSession(session);
    const admin = await this.adminModel.findById(hostId).select('whatsappSession').lean().exec();
    const stored = admin?.whatsappSession as StoredWhatsappSession | null | undefined;

    if (!stored?.archive) {
      return;
    }

    await fs.writeFile(path ?? this.archivePath(session), stored.archive);
  }

  async delete({ session }: RemoteAuthStorePayload): Promise<void> {
    const hostId = this.hostIdFromSession(session);
    await this.adminModel.findByIdAndUpdate(hostId, { whatsappSession: null }).exec();
  }

  private archivePath(session: string) {
    return path.join(this.dataPath, `${session}.zip`);
  }

  private hostIdFromSession(session: string) {
    return session.replace(/^RemoteAuth-/, '');
  }
}
