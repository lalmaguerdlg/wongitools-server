import { createLogger, format, transports } from "winston";

const customFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

let _logger;
if (process.env.NODE_ENV !== "production") {

  _logger = createLogger({
    level: "info",
    format: format.combine(format.colorize(), format.simple()),
    transports: [new transports.Console()],
  });

} else {

  _logger = createLogger({
    level: "info",
    format: format.combine(format.timestamp(), customFormat),
    transports: [
      new transports.File({
        filename: "error.log",
        level: "error",
      }),
      new transports.File({
        filename: "combined.log",
      }),
    ],
  });

}

export const logger = _logger;
