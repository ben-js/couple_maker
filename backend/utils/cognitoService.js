const { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, AdminGetUserCommand, AdminUpdateUserAttributesCommand, ResendConfirmationCodeCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Cognito 설정
const USER_POOL_ID = 'ap-northeast-2_B00TBxxGS';
const CLIENT_ID = '4agpf837q7oajaj3t6ghqv4a5m';
const REGION = 'ap-northeast-2';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

class CognitoService {
  /**
   * 회원가입
   * @param {string} email - 이메일
   * @param {string} password - 비밀번호
   * @param {string} name - 이름 (선택사항)
   * @returns {Promise<Object>} 회원가입 결과
   */
  async signUp(email, password, name = null) {
    try {
      const params = {
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email
          }
        ]
      };

      // 이름이 제공된 경우 추가
      if (name) {
        params.UserAttributes.push({
          Name: 'name',
          Value: name
        });
      }

      const command = new SignUpCommand(params);
      const result = await cognitoClient.send(command);

      return {
        success: true,
        userSub: result.UserSub,
        message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.'
      };
    } catch (error) {
      console.error('Cognito SignUp Error:', error);
      
      if (error.name === 'UsernameExistsException') {
        return {
          success: false,
          message: '이미 가입된 이메일입니다.'
        };
      } else if (error.name === 'InvalidPasswordException') {
        return {
          success: false,
          message: '비밀번호는 8자 이상이며, 소문자와 숫자를 포함해야 합니다.'
        };
      } else {
        return {
          success: false,
          message: '회원가입 중 오류가 발생했습니다.'
        };
      }
    }
  }

  /**
   * 이메일 인증 확인
   * @param {string} email - 이메일
   * @param {string} confirmationCode - 인증 코드
   * @returns {Promise<Object>} 인증 결과
   */
  async confirmSignUp(email, confirmationCode) {
    try {
      const params = {
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode
      };

      const command = new ConfirmSignUpCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: '이메일 인증이 완료되었습니다.'
      };
    } catch (error) {
      console.error('Cognito ConfirmSignUp Error:', error);
      
      if (error.name === 'CodeMismatchException') {
        return {
          success: false,
          message: '인증 코드가 올바르지 않습니다.'
        };
      } else if (error.name === 'ExpiredCodeException') {
        return {
          success: false,
          message: '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.'
        };
      } else {
        return {
          success: false,
          message: '인증 중 오류가 발생했습니다.'
        };
      }
    }
  }

  /**
   * 로그인
   * @param {string} email - 이메일
   * @param {string} password - 비밀번호
   * @returns {Promise<Object>} 로그인 결과
   */
  async signIn(email, password) {
    try {
      const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      };

      const command = new InitiateAuthCommand(params);
      const result = await cognitoClient.send(command);

      if (result.AuthenticationResult) {
        return {
          success: true,
          accessToken: result.AuthenticationResult.AccessToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
          idToken: result.AuthenticationResult.IdToken,
          expiresIn: result.AuthenticationResult.ExpiresIn,
          message: '로그인 성공'
        };
      } else {
        return {
          success: false,
          message: '로그인에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('Cognito SignIn Error:', error);
      
      if (error.name === 'NotAuthorizedException') {
        return {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
      } else if (error.name === 'UserNotConfirmedException') {
        // 이메일 인증이 안된 사용자의 경우, 사용자 정보를 조회하여 반환
        try {
          const userInfo = await this.getUserInfo(email);
          if (userInfo.success) {
            return {
              success: true,
              requiresEmailVerification: true,
              user: userInfo.user,
              message: '이메일 인증이 필요합니다.'
            };
          }
        } catch (userInfoError) {
          console.error('사용자 정보 조회 실패:', userInfoError);
        }
        
        return {
          success: true,
          requiresEmailVerification: true,
          user: { username: email },
          message: '이메일 인증이 필요합니다.'
        };
      } else if (error.name === 'UserNotFoundException') {
        return {
          success: false,
          message: '가입되지 않은 이메일입니다.'
        };
      } else {
        return {
          success: false,
          message: '로그인 중 오류가 발생했습니다.'
        };
      }
    }
  }

  /**
   * 사용자 정보 조회 (관리자 권한)
   * @param {string} username - 사용자명 (이메일)
   * @returns {Promise<Object>} 사용자 정보
   */
  async getUserInfo(username) {
    try {
      const params = {
        UserPoolId: USER_POOL_ID,
        Username: username
      };

      const command = new AdminGetUserCommand(params);
      const result = await cognitoClient.send(command);

      const userAttributes = {};
      result.UserAttributes.forEach(attr => {
        userAttributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        user: {
          username: result.Username,
          userStatus: result.UserStatus,
          enabled: result.Enabled,
          userCreateDate: result.UserCreateDate,
          userLastModifiedDate: result.UserLastModifiedDate,
          attributes: userAttributes
        }
      };
    } catch (error) {
      console.error('Cognito GetUserInfo Error:', error);
      return {
        success: false,
        message: '사용자 정보 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자 속성 업데이트 (관리자 권한)
   * @param {string} username - 사용자명 (이메일)
   * @param {Array} userAttributes - 업데이트할 속성 배열
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateUserAttributes(username, userAttributes) {
    try {
      const params = {
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: userAttributes
      };

      const command = new AdminUpdateUserAttributesCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: '사용자 정보가 업데이트되었습니다.'
      };
    } catch (error) {
      console.error('Cognito UpdateUserAttributes Error:', error);
      return {
        success: false,
        message: '사용자 정보 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 인증 코드 재발송
   * @param {string} email - 이메일
   * @returns {Promise<Object>} 재발송 결과
   */
  async resendConfirmationCode(email) {
    try {
      const params = {
        ClientId: CLIENT_ID,
        Username: email
      };

      const command = new ResendConfirmationCodeCommand(params);
      await cognitoClient.send(command);

      return {
        success: true,
        message: '인증 코드가 재발송되었습니다.'
      };
    } catch (error) {
      console.error('Cognito ResendConfirmationCode Error:', error);
      
      if (error.name === 'UserNotFoundException') {
        return {
          success: false,
          message: '가입되지 않은 이메일입니다.'
        };
      } else if (error.name === 'InvalidParameterException') {
        return {
          success: false,
          message: '이미 인증이 완료된 계정입니다.'
        };
      } else {
        return {
          success: false,
          message: '인증 코드 재발송 중 오류가 발생했습니다.'
        };
      }
    }
  }

  /**
   * JWT 토큰에서 사용자 정보 추출
   * @param {string} idToken - ID 토큰
   * @returns {Object} 토큰 정보
   */
  parseToken(idToken) {
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name,
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }
}

module.exports = new CognitoService(); 