import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { User } from 'src/user/entities/user.entity';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly expo = new Expo();

  constructor(@InjectModel('User') private UserModel: Model<User>) {}

  async sendToUser(userId: string, payload: PushPayload) {
    try {
      const user = await this.UserModel.findById(userId)
        .select('expoPushTokens')
        .lean()
        .exec();
      const tokens = (user?.expoPushTokens || []).filter(Boolean);
      if (!tokens.length) {
        return { sent: 0 };
      }

      const messages: ExpoPushMessage[] = tokens
        .filter((token) => Expo.isExpoPushToken(token))
        .map((to) => ({
          to,
          sound: 'default' as const,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        }));

      if (!messages.length) {
        this.logger.warn(`No valid Expo push tokens for user ${userId}`);
        return { sent: 0 };
      }

      const tickets: ExpoPushTicket[] = [];
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      const invalidTokens: string[] = [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          const errCode = (ticket as any).details?.error;
          this.logger.warn(
            `Push failed for user ${userId}: ${ticket.message} (${errCode})`,
          );
          if (
            errCode === 'DeviceNotRegistered' ||
            errCode === 'InvalidCredentials'
          ) {
            invalidTokens.push(messages[index].to as string);
          }
        }
      });

      if (invalidTokens.length) {
        await this.UserModel.updateOne(
          { _id: userId },
          { $pull: { expoPushTokens: { $in: invalidTokens } } } as any,
        );
      }

      return { sent: messages.length - invalidTokens.length };
    } catch (err) {
      this.logger.error(`Failed to send push to user ${userId}`, err as Error);
      return { sent: 0, error: (err as Error).message };
    }
  }
}
