import { StackContext, Cognito } from "sst/constructs";

export function Auth({ stack }: StackContext) {
  // Cognito User Pool 생성
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
    userPool: {
      // 사용자 풀 설정
      userPoolName: "couple-maker-users",
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false,
      },
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Couple Maker - 이메일 인증",
        emailBody: "인증 코드: {####}",
        emailStyle: "CODE",
      },
    },
    userPoolClient: {
      // 앱 클라이언트 설정
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    },
  });

  return {
    auth,
  };
} 