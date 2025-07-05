// 로거 유틸리티 - 개발 및 디버깅용
interface LogLevel {
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  success: (...args: any[]) => void;
}

interface ApiLogger {
  request: (method: string, url: string, data?: any) => void;
  response: (method: string, url: string, data?: any) => void;
  error: (method: string, url: string, error: any) => void;
}

interface NavigationLogger {
  navigate: (from: string, to: string, params?: any) => void;
  goBack: (from: string) => void;
  reset: (routes: string[]) => void;
}

class Logger {
  private isDevelopment = __DEV__;
  private isProduction = !__DEV__;

  // 기본 로그 레벨
  info = (...args: any[]) => {
    if (this.isDevelopment) {
      console.log('ℹ️ INFO:', ...args);
    }
  };

  debug = (...args: any[]) => {
    if (this.isDevelopment) {
      console.log('🔍 DEBUG:', ...args);
    }
  };

  warn = (...args: any[]) => {
    if (this.isDevelopment) {
      console.warn('⚠️ WARN:', ...args);
    }
  };

  error = (...args: any[]) => {
    if (this.isDevelopment) {
      console.error('❌ ERROR:', ...args);
    }
    // 프로덕션에서는 에러 추적 서비스로 전송
    if (this.isProduction) {
      // TODO: Sentry, Crashlytics 등 에러 추적 서비스 연동
    }
  };

  success = (...args: any[]) => {
    if (this.isDevelopment) {
      console.log('✅ SUCCESS:', ...args);
    }
  };

  // API 로깅
  api: ApiLogger = {
    request: (method: string, url: string, data?: any) => {
      if (this.isDevelopment) {
        console.log(`🌐 API ${method}:`, url);
        if (data) {
          console.log('📤 Request Data:', data);
        }
      }
    },

    response: (method: string, url: string, data?: any) => {
      if (this.isDevelopment) {
        console.log(`✅ API ${method} Response:`, url);
        if (data) {
          console.log('📥 Response Data:', data);
        }
      }
    },

    error: (method: string, url: string, error: any) => {
      if (this.isDevelopment) {
        console.error(`❌ API ${method} Error:`, url);
        console.error('Error Details:', error);
      }
    },
  };

  // 네비게이션 로깅
  navigation: NavigationLogger = {
    navigate: (from: string, to: string, params?: any) => {
      if (this.isDevelopment) {
        console.log(`🧭 NAVIGATE: ${from} → ${to}`);
        if (params) {
          console.log('📋 Params:', params);
        }
      }
    },

    goBack: (from: string) => {
      if (this.isDevelopment) {
        console.log(`⬅️ GO BACK: ${from}`);
      }
    },

    reset: (routes: string[]) => {
      if (this.isDevelopment) {
        console.log(`🔄 NAVIGATION RESET:`, routes);
      }
    },
  };

  // 사용자 액션 로깅
  userAction = (action: string, screen: string, details?: any) => {
    if (this.isDevelopment) {
      console.log(`👤 USER ACTION: ${action} on ${screen}`);
      if (details) {
        console.log('📋 Details:', details);
      }
    }
  };

  // 성능 로깅
  performance = (operation: string, duration: number) => {
    if (this.isDevelopment) {
      console.log(`⏱️ PERFORMANCE: ${operation} took ${duration}ms`);
    }
  };

  // 상태 변경 로깅
  stateChange = (component: string, prevState: any, nextState: any) => {
    if (this.isDevelopment) {
      console.log(`🔄 STATE CHANGE in ${component}:`);
      console.log('Previous:', prevState);
      console.log('Next:', nextState);
    }
  };

  // 폼 로깅
  form = (action: string, formName: string, data?: any) => {
    if (this.isDevelopment) {
      console.log(`📝 FORM ${action}: ${formName}`);
      if (data) {
        console.log('📋 Form Data:', data);
      }
    }
  };

  // 이미지 처리 로깅
  image = (action: string, details?: any) => {
    if (this.isDevelopment) {
      console.log(`🖼️ IMAGE ${action}:`);
      if (details) {
        console.log('📋 Details:', details);
      }
    }
  };

  // 로컬 스토리지 로깅
  storage = (action: string, key: string, data?: any) => {
    if (this.isDevelopment) {
      console.log(`💾 STORAGE ${action}: ${key}`);
      if (data) {
        console.log('📋 Data:', data);
      }
    }
  };
}

// 싱글톤 인스턴스
export const logger = new Logger(); 