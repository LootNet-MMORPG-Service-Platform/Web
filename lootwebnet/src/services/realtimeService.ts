import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { HUB_URL } from './urls'

let connection: HubConnection | null = null
const listeners = new Set<(payload: any) => void>()

function buildConnection() {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('token') ?? ''
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
}

export async function startRealtime() {
  const token = localStorage.getItem('token')
  if (!token)
    return

  if (!connection)
    connection = buildConnection()

  if (connection.state === HubConnectionState.Disconnected) {
    try {
      await connection.start()
      connection.on('AppStateChanged', (payload) => {
        listeners.forEach(fn => fn(payload))
      })
      connection.on('UserStateChanged', (payload) => {
        listeners.forEach(fn => fn(payload))
      })
    } catch (error) {
      console.error('Realtime connection failed', error)
    }
  }
}

export async function stopRealtime() {
  if (!connection)
    return

  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop()
  }
}

export function onRealtimeEvent(handler: (payload: any) => void) {
  listeners.add(handler)
  return () => listeners.delete(handler)
}
