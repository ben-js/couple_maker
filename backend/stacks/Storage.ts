import { StackContext, Bucket } from "sst/constructs";

export function Storage({ stack }: StackContext) {
  // 사용자 프로필 이미지 저장용 버킷
  const profileImagesBucket = new Bucket(stack, "ProfileImages", {
    cors: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE"],
        allowedOrigins: ["*"], // 프로덕션에서는 특정 도메인으로 제한
        maxAge: 3000,
      },
    ],
  });

  // 채팅 이미지 저장용 버킷
  const chatImagesBucket = new Bucket(stack, "ChatImages", {
    cors: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE"],
        allowedOrigins: ["*"],
        maxAge: 3000,
      },
    ],
  });

  return {
    profileImagesBucket,
    chatImagesBucket,
  };
} 