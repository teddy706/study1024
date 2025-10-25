import React, { useState, useEffect } from 'react'
import { notificationService, Notification } from '../../services/notifications/notification.service'

interface NotificationCenterProps {
  userId: string
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const unreadNotifications = await notificationService.getUnreadNotifications(userId)
      setNotifications(unreadNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (loading) {
    return <div className="animate-spin">로딩 중...</div>
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">알림 센터</h3>
        <p className="text-sm text-gray-500">
          {notifications.length}개의 읽지 않은 알림
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="p-4 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleMarkAsRead(notification.id)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                읽음
              </button>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            새로운 알림이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}