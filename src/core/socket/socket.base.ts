import io, { Socket } from 'socket.io-client'
import { CONFIG } from '../../config'
import { REFRESH_TOKEN } from '../local-storage.service'
import { SocketService } from './socket.service'
import { SOCKET_EVENT } from './socket.variable'
import { SocketTicketService } from './socket-ticket.service'

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

  SocketBase.on(SOCKET_EVENT.SOCKET_ORGANIZATION_UPDATE, (data) => {
    SocketService.listenOrganizationUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_MASTER_DATA_CHANGE, (data) => {
    SocketService.listenMasterDataChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_SETTING_RELOAD, (data) => {
    SocketService.listenSettingReload(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_DISTRIBUTOR_UPSERT, (data) => {
    SocketService.listenDistributorUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_CUSTOMER_UPSERT, (data) => {
    SocketService.listenCustomerUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_PRODUCT_LIST_CHANGE, (data) => {
    SocketService.listenProductListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_BATCH_LIST_CHANGE, (data) => {
    SocketService.listenBatchListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_PROCEDURE_LIST_CHANGE, (data) => {
    SocketService.listenProcedureListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_LABORATORY_LIST_CHANGE, (data) => {
    SocketService.listenLaboratoryListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_RADIOLOGY_LIST_CHANGE, (data) => {
    SocketService.listenRadiologyListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_POSITION_LIST_CHANGE, (data) => {
    SocketService.listenPositionListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_DISCOUNT_LIST_CHANGE, (data) => {
    SocketService.listenDiscountListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.SOCKET_TICKET_LIST_CHANGE, (data) => {
    SocketService.listenSocketTicketListChange(data)
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
