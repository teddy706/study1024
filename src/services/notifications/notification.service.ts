import { supabase } from '../../utils/supabase'

export interface Notification {
  id: string
  type: 'report' | 'schedule' | 'news'
  title: string
  message: string
  userId: string
  read: boolean
  created_at: string
}

class NotificationService {
  private async sendEmail(email: string, subject: string, body: string) {
    // 실제 구현에서는 이메일 서비스(예: SendGrid) 사용
    console.log(`Sending email to ${email}: ${subject}`)
  }

  private async sendSlackMessage(channel: string, message: string) {
    // 실제 구현에서는 Slack API 사용
    const slackWebhook = import.meta.env.VITE_SLACK_WEBHOOK_URL
    await fetch(slackWebhook, {
      method: 'POST',
      body: JSON.stringify({ text: message })
    })
  }

  async createNotification(
    type: Notification['type'],
    title: string,
    message: string,
    userId: string
  ): Promise<Notification> {
    const notification = {
      type,
      title,
      message,
      userId,
      read: false,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async notify(
    type: Notification['type'],
    title: string,
    message: string,
    userId: string,
    options: {
      email?: string
      slackChannel?: string
    } = {}
  ): Promise<void> {
    // 1. 데이터베이스에 알림 저장
    await this.createNotification(type, title, message, userId)

    // 2. 이메일 전송 (설정된 경우)
    if (options.email) {
      await this.sendEmail(options.email, title, message)
    }

    // 3. Slack 메시지 전송 (설정된 경우)
    if (options.slackChannel) {
      await this.sendSlackMessage(options.slackChannel, `${title}\n${message}`)
    }
  }
}

export const notificationService = new NotificationService()