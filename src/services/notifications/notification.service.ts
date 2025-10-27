import { supabase } from '../../config/supabase'

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

  private async sendSlackMessage(_channel: string, message: string) {
    // Edge Function으로 위임 (채널은 웹훅 특성상 서버 설정값 사용)
    await supabase.functions.invoke('send-slack', {
      body: { text: message },
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
      .insert(notification as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async markAsRead(notificationId: string): Promise<void> {
    // Supabase 타입 시스템 문제로 any 타입 사용
    const query = supabase.from('notifications') as any
    const { error } = await query
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