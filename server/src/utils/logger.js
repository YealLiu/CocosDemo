/**
 * 日志工具
 * 简单的日志记录器
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

function formatTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function log(level, ...args) {
  if (LOG_LEVELS[level] >= CURRENT_LEVEL) {
    console.log(`[${formatTime()}] [${level}]`, ...args);
  }
}

const logger = {
  debug: (...args) => log('DEBUG', ...args),
  info: (...args) => log('INFO', ...args),
  warn: (...args) => log('WARN', ...args),
  error: (...args) => log('ERROR', ...args)
};

module.exports = logger;