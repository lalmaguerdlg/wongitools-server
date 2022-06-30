
export interface IPCAdvertiseServiceMessage {
  type: 'advertise-service'
  service: Service
}

export interface IPCUpdatePortMessage {
  type: 'update-service-port'
  name: string
  port: number
}

export interface IPCOtherMessage {
  type: 'other'
  content: string
}

export type IPCMessage = IPCAdvertiseServiceMessage | IPCUpdatePortMessage | IPCOtherMessage 

export interface LocalService {
  type: 'local'
  name: string
  ip?: string
  port: number
}

export interface RemoteService {
  type: 'remote'
  name: string
  ip: string
  port: number
}

export type Service = LocalService | RemoteService