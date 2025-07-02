import { StackContext, Api, use } from "sst/constructs";
import { Database } from "./Database";
import { Storage } from "./Storage";
import { Auth } from "./Auth";

export function API({ stack }: StackContext) {
  const { usersTable, matchesTable, likesTable, chatsTable, messagesTable, userSettingsTable } = use(Database);
  const { profileImagesBucket, chatImagesBucket } = use(Storage);
  const { auth } = use(Auth);

  // API Gateway 생성
  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [usersTable, matchesTable, likesTable, chatsTable, messagesTable, userSettingsTable, profileImagesBucket, chatImagesBucket],
        environment: {
          USER_POOL_ID: auth.userPoolId,
          USER_POOL_CLIENT_ID: auth.userPoolClientId,
        },
      },
    },
    routes: {
      // 인증 관련 API
      "POST /auth/register": "src/functions/auth/register.handler",
      "POST /auth/login": "src/functions/auth/login.handler",
      "POST /auth/verify": "src/functions/auth/verify.handler",
      "POST /auth/forgot-password": "src/functions/auth/forgotPassword.handler",
      "POST /auth/reset-password": "src/functions/auth/resetPassword.handler",
      "POST /auth/refresh": "src/functions/auth/refresh.handler",
      "POST /auth/logout": "src/functions/auth/logout.handler",

      // 사용자 프로필 API
      "GET /users/profile": "src/functions/users/getProfile.handler",
      "PUT /users/profile": "src/functions/users/updateProfile.handler",
      "POST /users/profile/photo": "src/functions/users/uploadPhoto.handler",
      "DELETE /users/profile/photo/{photoId}": "src/functions/users/deletePhoto.handler",
      "GET /users/{userId}": "src/functions/users/getUser.handler",

      // 추천 사용자 API
      "GET /users/recommendations": "src/functions/users/getRecommendations.handler",
      "GET /users/search": "src/functions/users/searchUsers.handler",

      // 좋아요/매칭 API
      "POST /likes": "src/functions/likes/createLike.handler",
      "DELETE /likes/{likeId}": "src/functions/likes/deleteLike.handler",
      "GET /likes/received": "src/functions/likes/getReceivedLikes.handler",
      "GET /likes/sent": "src/functions/likes/getSentLikes.handler",

      // 매칭 API
      "GET /matches": "src/functions/matches/getMatches.handler",
      "POST /matches/{matchId}/accept": "src/functions/matches/acceptMatch.handler",
      "POST /matches/{matchId}/reject": "src/functions/matches/rejectMatch.handler",

      // 채팅 API
      "GET /chats": "src/functions/chats/getChats.handler",
      "POST /chats": "src/functions/chats/createChat.handler",
      "GET /chats/{chatId}/messages": "src/functions/chats/getMessages.handler",
      "POST /chats/{chatId}/messages": "src/functions/chats/sendMessage.handler",
      "POST /chats/{chatId}/messages/read": "src/functions/chats/markAsRead.handler",

      // 파일 업로드 API
      "POST /upload/profile": "src/functions/upload/uploadProfileImage.handler",
      "POST /upload/chat": "src/functions/upload/uploadChatImage.handler",

      // 설정 API
      "GET /settings": "src/functions/settings/getSettings.handler",
      "PUT /settings": "src/functions/settings/updateSettings.handler",

      // 알림 API
      "GET /notifications": "src/functions/notifications/getNotifications.handler",
      "PUT /notifications/{notificationId}/read": "src/functions/notifications/markAsRead.handler",
      "DELETE /notifications/{notificationId}": "src/functions/notifications/deleteNotification.handler",
    },
  });

  // API에 Cognito 인증 추가
  api.attachPermissionsToRoute("GET /users/profile", [auth, "grant"]);
  api.attachPermissionsToRoute("PUT /users/profile", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /users/profile/photo", [auth, "grant"]);
  api.attachPermissionsToRoute("DELETE /users/profile/photo/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /users/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /users/recommendations", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /users/search", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /likes", [auth, "grant"]);
  api.attachPermissionsToRoute("DELETE /likes/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /likes/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /matches", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /matches/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /chats", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /chats", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /chats/*", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /chats/*", [auth, "grant"]);
  api.attachPermissionsToRoute("POST /upload/*", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /settings", [auth, "grant"]);
  api.attachPermissionsToRoute("PUT /settings", [auth, "grant"]);
  api.attachPermissionsToRoute("GET /notifications", [auth, "grant"]);
  api.attachPermissionsToRoute("PUT /notifications/*", [auth, "grant"]);
  api.attachPermissionsToRoute("DELETE /notifications/*", [auth, "grant"]);

  // 스택 출력
  stack.addOutputs({
    ApiEndpoint: api.url,
    UserPoolId: auth.userPoolId,
    UserPoolClientId: auth.userPoolClientId,
  });

  return {
    api,
  };
} 