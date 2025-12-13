import io, { Socket } from 'socket.io-client'
import { CONFIG } from '../../config'
import { REFRESH_TOKEN } from '../local-storage.service'
import { SocketTicketService } from './socket-ticket.service'
import { SocketService } from './socket.service'
import { SOCKET_EVENT } from './socket.variable'

let SocketBase: Socket

export const socketInit = () => {
  SocketBase = io(CONFIG.API_URL, {
    transports: ['websocket'],
    auth: { token: localStorage.getItem(REFRESH_TOKEN) },
    timeout: 10000,
  })
  SocketBase.connect()

  SocketBase.on('connect', () => {
    console.log('Socket Connected')
  })
  SocketBase.on('disconnect', () => {
    console.log('Socket Disconnect')
  })

  SocketBase.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message)
  })

  if (CONFIG.MODE === 'development') {
    SocketBase.onAny((event, ...args) => {
      console.log(`Socket listen event: ${event}`, args)
    })
  }

  SocketBase.on(SOCKET_EVENT.SERVER_EMIT_DEMO, (data) => {
    SocketService.listenServerEmitDemo(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_TICKET_CHANGE, (data) => {
    SocketTicketService.listenSocketTicketChange(data)
  })
  SocketBase.on(SOCKET_EVENT.SOCKET_MASTER_DATA_CHANGE, (data) => {
    SocketService.listenMasterDataChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_ORGANIZATION_UPDATE, (data) => {
    SocketService.listenOrganizationUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_SETTING_RELOAD, (data) => {
    SocketService.listenSettingReload(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_CUSTOMER_UPSERT, (data) => {
    SocketService.listenCustomerUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_PRODUCT_LIST_CHANGE, (data) => {
    SocketService.listenProductListChange(data)
  })
}

export const reconnectSocket = () => {
  if (SocketBase) {
    SocketBase.disconnect()
    SocketBase.auth = { token: localStorage.getItem(REFRESH_TOKEN) }
    SocketBase.connect()
  }
}

export { SocketBase }
