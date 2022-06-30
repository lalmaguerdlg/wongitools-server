import dotenv from 'dotenv'
dotenv.config()

export const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
export const UDP_PORT = process.env.UDP_PORT? Number.parseInt(process.env.UDP_PORT) : 17177;
export const SERVICE_NAME = process.env.SERIVICE_NAME ?? 'wongi-tools.service';