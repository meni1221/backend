import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WhatsappManagerService, WhatsappClientSnapshot } from '../manager';

@WebSocketGateway({
  namespace: 'whatsapp-ws',
  cors: { origin: true, credentials: true },
})
export class WhatsappGateway implements OnGatewayConnection {
  private readonly logger = new Logger(WhatsappGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => WhatsappManagerService))
    private readonly whatsappManager: WhatsappManagerService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.debug(`WhatsApp socket connected: ${client.id}`);
  }

  @SubscribeMessage('watch-host')
  async watchHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { hostId: string },
  ): Promise<WhatsappClientSnapshot> {
    const room = this.hostRoom(payload.hostId);
    await client.join(room);
    const snapshot = await this.whatsappManager.ensureClient(payload.hostId);
    this.emitSnapshot(payload.hostId, snapshot);
    return snapshot;
  }

  emitSnapshot(hostId: string, snapshot: WhatsappClientSnapshot) {
    this.server.to(this.hostRoom(hostId)).emit('whatsapp-status', snapshot);
  }

  private hostRoom(hostId: string) {
    return `host:${hostId}`;
  }
}
