import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CreateFrontendLogDto, LogQueryDto } from '../dto';
import { LogLevel, LogSource, SystemLog, SystemLogDocument } from '../schemas';

export type AppLogPayload = {
  category: string;
  durationMs?: number;
  hostId?: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  method?: string;
  path?: string;
  requestId?: string;
  source: LogSource;
  statusCode?: number;
  userEmail?: string;
};

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

@Injectable()
export class AppLoggerService {
  constructor(
    @InjectModel(SystemLog.name) private readonly logModel: Model<SystemLogDocument>,
    private readonly config: ConfigService,
  ) {}

  async write(payload: AppLogPayload) {
    if (!this.shouldLog(payload.level)) {
      return;
    }

    const log = this.normalizePayload(payload);
    this.writeConsole(log);

    if (this.config.get<string>('LOG_TO_DB') !== 'true') {
      return;
    }

    try {
      await this.logModel.create(log);
    } catch (cause) {
      this.writeConsole({
        category: 'logger',
        level: LogLevel.ERROR,
        message: 'Failed to persist log entry',
        meta: { cause: cause instanceof Error ? cause.message : 'unknown' },
        source: LogSource.BACKEND,
      });
    }
  }

  async writeFrontend(host: { hostId: string; email?: string }, dto: CreateFrontendLogDto) {
    await this.write({
      category: dto.category,
      hostId: host.hostId,
      level: dto.level,
      message: dto.message,
      meta: dto.meta,
      path: dto.path,
      requestId: dto.requestId,
      source: LogSource.FRONTEND,
      userEmail: host.email,
    });

    return { received: true };
  }

  async find(query: LogQueryDto) {
    const filter: FilterQuery<SystemLogDocument> = {};

    if (query.level) {
      filter.level = query.level;
    }

    if (query.source) {
      filter.source = query.source;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.requestId) {
      filter.requestId = query.requestId;
    }

    if (query.hostId && Types.ObjectId.isValid(query.hostId)) {
      filter.hostId = new Types.ObjectId(query.hostId);
    }

    if (query.search) {
      filter.$or = [
        { message: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
        { userEmail: { $regex: query.search, $options: 'i' } },
      ];
    }

    const createdAt: { $gte?: Date; $lte?: Date } = {};
    if (query.from) {
      createdAt.$gte = new Date(query.from);
    }

    if (query.to) {
      createdAt.$lte = new Date(query.to);
    }

    if (createdAt.$gte || createdAt.$lte) {
      filter.createdAt = createdAt;
    }

    const limit = query.limit ?? 100;
    const skip = query.skip ?? 0;
    const [items, total] = await Promise.all([
      this.logModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.logModel.countDocuments(filter).exec(),
    ]);

    return { items, total, limit, skip };
  }

  private normalizePayload(payload: AppLogPayload) {
    return {
      ...payload,
      hostId: payload.hostId && Types.ObjectId.isValid(payload.hostId) ? new Types.ObjectId(payload.hostId) : undefined,
      meta: this.sanitizeMeta(payload.meta ?? {}),
    };
  }

  private sanitizeMeta(meta: Record<string, unknown>) {
    return this.sanitizeValue(meta) as Record<string, unknown>;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    const blockedKeys = ['password', 'passwordhash', 'accesstoken', 'refreshtoken', 'token', 'authorization', 'cookie', 'secret'];

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      acc[key] = blockedKeys.includes(normalizedKey) ? '[redacted]' : this.sanitizeValue(nestedValue);
      return acc;
    }, {});
  }

  private shouldLog(level: LogLevel) {
    const configuredLevel = (this.config.get<string>('LOG_LEVEL') ?? 'info') as LogLevel;
    return levelWeight[level] >= (levelWeight[configuredLevel] ?? levelWeight.info);
  }

  private writeConsole(payload: Omit<AppLogPayload, 'hostId'> & { hostId?: Types.ObjectId | string }) {
    if (!['http.request', 'http.error'].includes(payload.category)) {
      return;
    }

    const status = (payload.statusCode ?? 500) < 400 ? 'success' : 'failed';
    const line = `[backend] request ${payload.method ?? ''} ${payload.path ?? ''} ${status}${payload.statusCode ? ` ${payload.statusCode}` : ''}`.trim();

    if ([LogLevel.ERROR, LogLevel.FATAL].includes(payload.level)) {
      process.stderr.write(`${line}\n`);
      return;
    }

    process.stdout.write(`${line}\n`);
  }
}
