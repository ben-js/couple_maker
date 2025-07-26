/**
 * Logger Utility - 일관된 로깅 시스템
 * @module utils/logger
 */
const config = require('../config');

class Logger {
  /**
   * 정보 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  info(message, data = {}) {
    if (config.env !== 'production') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    }
  }

  /**
   * 경고 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  warn(message, data = {}) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  }

  /**
   * 에러 로그
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  error(message, data = {}) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, data);
  }

  /**
   * 디버그 로그 (개발 환경에서만)
   * @param {string} message - 로그 메시지
   * @param {Object} data - 추가 데이터
   */
  debug(message, data = {}) {
    if (config.env === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }

  /**
   * API 요청 로그
   * @param {string} method - HTTP 메서드
   * @param {string} url - 요청 URL
   * @param {Object} data - 요청 데이터
   */
  apiRequest(method, url, data = {}) {
    this.info(`API ${method} ${url}`, data);
  }

  /**
   * API 응답 로그
   * @param {string} method - HTTP 메서드
   * @param {string} url - 요청 URL
   * @param {number} statusCode - 응답 상태 코드
   * @param {number} responseTime - 응답 시간 (ms)
   */
  apiResponse(method, url, statusCode, responseTime) {
    this.info(`API ${method} ${url} - ${statusCode} (${responseTime}ms)`);
  }

  /**
   * 데이터베이스 쿼리 로그
   * @param {string} operation - DB 작업 (GET, PUT, UPDATE, DELETE 등)
   * @param {string} table - 테이블명
   * @param {Object} data - 쿼리 데이터
   */
  dbQuery(operation, table, data = {}) {
    this.debug(`DB ${operation} ${table}`, data);
  }
}

module.exports = new Logger(); 