import { api } from './api';

export const chatService = {
  /**
   * Получить все чаты пользователя
   */
  getChats: async () => {
    return api.get('/chats/');
  },

  /**
   * Получить конкретный чат
   */
  getChat: async (chatId: string) => {
    return api.get(`/chats/${chatId}/`);
  },

  /**
   * Создать новый приватный чат
   */
  createPrivateChat: async (userId: string) => {
    return api.post('/chats/', {
      chat_type: 'private',
      user_id: userId,
    });
  },

  /**
   * Отправить сообщение в чат
   */
  sendMessage: async (chatId: string, content: string) => {
    return api.post(`/chats/${chatId}/send_message/`, {
      content,
    });
  },

  /**
   * Получить сообщения из чата
   */
  getMessages: async (chatId: string, page = 1) => {
    return api.get(`/chats/${chatId}/messages/?page=${page}`);
  },

  /**
   * Получить мой статус онлайна
   */
  getMyStatus: async () => {
    return api.get('/online-status/my_status/');
  },

  /**
   * Получить статусы онлайна членов класса
   */
  getClassMembersStatus: async () => {
    return api.get('/online-status/class_members_status/');
  },

  /**
   * Получить все статусы онлайна
   */
  getAllStatuses: async () => {
    return api.get('/online-status/');
  },
};
