// src/utils/logger.js
// Custom logger with colorful and styled output

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  },
};

const logLevels = {
  INFO: { color: colors.fg.green, label: 'INFO   ' },
  WARN: { color: colors.fg.yellow, label: 'WARN   ' },
  ERROR: { color: colors.fg.red, label: 'ERROR  ' },
  SUCCESS: { color: colors.fg.cyan, label: 'SUCCESS' },
  DEBUG: { color: colors.fg.blue, label: 'DEBUG  ' },
};

const formatLog = (level, message) => {
  // Format timestamp to Asia/Jakarta timezone in YYYY-MM-DD H:i:s format
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
  
  const year = jakartaTime.getFullYear();
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  const hours = String(jakartaTime.getHours()).padStart(2, '0');
  const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
  const seconds = String(jakartaTime.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  const { color, label } = logLevels[level];
  return `${colors.bright}${colors.fg.white}[${timestamp}]${colors.reset} ${color}[${label}]${colors.reset} ${message}`;
};

// Get terminal width with fallback
const getTerminalWidth = () => {
  return process.stdout.columns || 80;
};

// Truncate text if too long
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Center text within given width
const centerText = (text, width) => {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
};

export const logger = {
  info: (message) => {
    console.log(formatLog('INFO', message));
  },
  
  warn: (message) => {
    console.log(formatLog('WARN', message));
  },
  
  error: (message) => {
    console.log(formatLog('ERROR', message));
  },
  
  success: (message) => {
    console.log(formatLog('SUCCESS', message));
  },
  
  debug: (message) => {
    console.log(formatLog('DEBUG', message));
  },
  
  serverStart: (port, docsUrl) => {
    const timestamp = new Date().toISOString();
    const cyan = colors.fg.cyan;
    const green = colors.fg.green;
    const blue = colors.fg.blue;
    const magenta = colors.fg.magenta;
    const white = colors.fg.white;
    const bright = colors.bright;
    const reset = colors.reset;
    
    // Get terminal width and calculate box width
    const termWidth = getTerminalWidth();
    const minWidth = 60;
    const maxWidth = 100;
    const boxWidth = Math.min(maxWidth, Math.max(minWidth, termWidth - 4));
    const innerWidth = boxWidth - 4; // Account for borders and padding
    
    // Create responsive borders
    const topBorder = ' ╔' + '═'.repeat(boxWidth - 2) + '╗';
    const middleBorder = ' ╠' + '═'.repeat(boxWidth - 2) + '╣';
    const separator = ' ╟' + '─'.repeat(boxWidth - 2) + '╢';
    const bottomBorder = ' ╚' + '═'.repeat(boxWidth - 2) + '╝';
    
    // Prepare texts
    const title = '🌐 DockPod! - PaaS Platform';
    const subtitle = 'Dibuat Oleh Alam Wibowo - Website https://kodeku.web.app';
    const statusText = '🚀 SERVER STATUS';
    
    // Truncate if needed
    const docsUrlDisplay = truncateText(docsUrl, innerWidth - 13);
    const timestampDisplay = truncateText(timestamp, innerWidth - 13);
    
    // Build content lines
    const titleLine = ' ║ ' + centerText(title, innerWidth) + ' ║';
    const subtitleLine = ' ║ ' + centerText(truncateText(subtitle, innerWidth), innerWidth) + ' ║';
    const statusLine = ' ║ ' + white + statusText + cyan + ' '.repeat(innerWidth - statusText.length) + ' ║';
    
    // Info lines with proper padding
    const buildInfoLine = (label, value, valueColor) => {
      const text = `   ${label}    ${value}`;
      const padding = ' '.repeat(Math.max(0, innerWidth - text.length));
      return ` ║ ${white}   ${label}${reset}    ${valueColor}${value}${cyan}${padding} ║`;
    };
    
    const timeLine = buildInfoLine('Time:', timestampDisplay, white);
    const portLine = buildInfoLine('Port:', port, green);
    const docsLine = buildInfoLine('Docs:', docsUrlDisplay, blue);
    const wsLine = buildInfoLine('WS:', 'Ready for real-time connections', magenta);
    
    // Print the banner
    console.log('\n' + cyan + bright);
    console.log(topBorder);
    console.log(titleLine);
    console.log(subtitleLine);
    console.log(middleBorder);
    console.log(statusLine);
    console.log(separator);
    console.log(timeLine);
    console.log(portLine);
    console.log(docsLine);
    console.log(wsLine);
    console.log(bottomBorder);
    console.log(reset + '\n');
  },
  
  dbConnected: () => {
    const timestamp = new Date().toISOString();
    console.log(`${colors.bright}${colors.fg.white}[${timestamp}]${colors.reset} ${colors.fg.cyan}⚡ DATABASE${colors.reset} ${colors.fg.green}CONNECTION ESTABLISHED${colors.reset}`);
  },
  
  dbSynced: () => {
    const timestamp = new Date().toISOString();
    console.log(`${colors.bright}${colors.fg.white}[${timestamp}]${colors.reset} ${colors.fg.cyan}🔄 DATABASE${colors.reset} ${colors.fg.green}SYNCHRONIZED${colors.reset}`);
  }
};

export default logger;