import { StackContext, Table } from "sst/constructs";

export function Database({ stack }: StackContext) {
  // 사용자 테이블
  const usersTable = new Table(stack, "Users", {
    fields: {
      id: "string", // 사용자 ID
      email: "string", // 이메일 (GSI)
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      emailIndex: {
        hashKey: "email",
      },
    },
  });

  // 매칭 테이블
  const matchesTable = new Table(stack, "Matches", {
    fields: {
      id: "string", // 매칭 ID
      userId: "string", // 사용자 ID
      matchedUserId: "string", // 매칭된 사용자 ID
      status: "string", // pending, accepted, rejected
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      userMatchesIndex: {
        hashKey: "userId",
        rangeKey: "status",
      },
      matchedUserIndex: {
        hashKey: "matchedUserId",
        rangeKey: "status",
      },
    },
  });

  // 좋아요 테이블
  const likesTable = new Table(stack, "Likes", {
    fields: {
      id: "string", // 좋아요 ID
      fromUserId: "string", // 보낸 사용자 ID
      toUserId: "string", // 받은 사용자 ID
      type: "string", // like, super_like
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      fromUserIndex: {
        hashKey: "fromUserId",
        rangeKey: "toUserId",
      },
      toUserIndex: {
        hashKey: "toUserId",
        rangeKey: "fromUserId",
      },
    },
  });

  // 채팅 테이블
  const chatsTable = new Table(stack, "Chats", {
    fields: {
      id: "string", // 채팅방 ID
      participants: "string", // 참여자 ID들 (정렬된 문자열)
      lastMessageAt: "string", // 마지막 메시지 시간
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      participantsIndex: {
        hashKey: "participants",
        rangeKey: "lastMessageAt",
      },
    },
  });

  // 메시지 테이블
  const messagesTable = new Table(stack, "Messages", {
    fields: {
      id: "string", // 메시지 ID
      chatId: "string", // 채팅방 ID
      senderId: "string", // 보낸 사용자 ID
      timestamp: "string", // 메시지 시간
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      chatMessagesIndex: {
        hashKey: "chatId",
        rangeKey: "timestamp",
      },
    },
  });

  // 사용자 설정 테이블
  const userSettingsTable = new Table(stack, "UserSettings", {
    fields: {
      userId: "string", // 사용자 ID
      settingKey: "string", // 설정 키
    },
    primaryIndex: { hashKey: "userId", rangeKey: "settingKey" },
  });

  return {
    usersTable,
    matchesTable,
    likesTable,
    chatsTable,
    messagesTable,
    userSettingsTable,
  };
} 