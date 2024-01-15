import io, { Socket } from 'socket.io-client'
import { CONFIG } from '../../config'
import { REFRESH_TOKEN } from '../local-storage.service'
import { SOCKET_EVENT } from './socket.variable'

let SocketService: Socket

export const initSocket = () => {
  SocketService = io(CONFIG.API_URL, {
    transports: ['websocket'],
    auth: { token: localStorage.getItem(REFRESH_TOKEN) },
  })
  SocketService.connect()

  SocketService.on('connect', () => {
    console.log('Socket Connected')
  })
  SocketService.on('disconnect', () => {
    console.log('Socket Disconnect')
  })

  SocketService.on(SOCKET_EVENT.ADMISSION_NEW, (data) => {
    // ArrivalInvoiceService.onEventNewArrival(data)
  })
}

export const reconnectSocket = () => {
  SocketService.disconnect()
  SocketService.auth = { token: localStorage.getItem(REFRESH_TOKEN) }
  SocketService.connect()
}

export { SocketService }
