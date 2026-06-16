import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SystemLogDocument = HydratedDocument<SystemLog>;

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogSource {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
}

@Schema({ timestamps: true, collection: 'system_logs' })
export class SystemLog {
  @Prop({ type: String, enum: Object.values(LogLevel), required: true, index: true })
  level!: LogLevel;

  @Prop({ type: String, enum: Object.values(LogSource), required: true, index: true })
  source!: LogSource;

  @Prop({ type: String, required: true, index: true })
  category!: string;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: String, index: true })
  requestId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  hostId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, index: true })
  userEmail?: string;

  @Prop({ type: String, index: true })
  method?: string;

  @Prop({ type: String, index: true })
  path?: string;

  @Prop({ type: Number, index: true })
  statusCode?: number;

  @Prop({ type: Number })
  durationMs?: number;

  @Prop({ type: Object, default: {} })
  meta!: Record<string, unknown>;
}

export const SystemLogSchema = SchemaFactory.createForClass(SystemLog);

SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ level: 1, source: 1, createdAt: -1 });
SystemLogSchema.index({ category: 1, createdAt: -1 });
SystemLogSchema.index({ requestId: 1, createdAt: -1 });
SystemLogSchema.index({ hostId: 1, createdAt: -1 });
