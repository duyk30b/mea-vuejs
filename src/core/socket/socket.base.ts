import io, { Socket } from 'socket.io-client'
import { CONFIG } from '../../config'
import { REFRESH_TOKEN } from '../local-storage.service'
import { SocketService } from './socket.service'
import { SOCKET_EVENT } from './socket.variable'

let SocketBase: Socket

export const socketInit = () => {
  SocketBase = io(CONFIG.API_URL, {
    transports: ['websocket'],
    auth: { token: localStorage.getItem(REFRESH_TOKEN) },
  })
  SocketBase.connect()

  SocketBase.on('connect', () => {
    console.log('Socket Connected')
  })
  SocketBase.on('disconnect', () => {
    console.log('Socket Disconnect')
  })

  SocketBase.on(SOCKET_EVENT.SERVER_EMIT_DEMO, (data) => {
    SocketService.listenServerEmitDemo(data)
  })

  SocketBase.on(SOCKET_EVENT.DISTRIBUTOR_UPSERT, (data) => {
    SocketService.listenDistributorUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.CUSTOMER_UPSERT, (data) => {
    SocketService.listenCustomerUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.PRODUCT_UPSERT, (data) => {
    SocketService.listenProductUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.PRODUCT_LIST_UPDATE, (data) => {
    SocketService.listenProductListUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.BATCH_UPSERT, (data) => {
    SocketService.listenBatchUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.BATCH_LIST_UPDATE, (data) => {
    SocketService.listenBatchListUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.PROCEDURE_UPSERT, (data) => {
    SocketService.listenProcedureUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.SETTING_RELOAD, (data) => {
    SocketService.listenSettingReload(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CREATE, (data) => {
    SocketService.listenTicketClinicCreate(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_UPDATE, (data) => {
    SocketService.listenTicketClinicUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_UPDATE_TICKET_DIAGNOSIS, (data) => {
    SocketService.listenTicketClinicUpdateTicketDiagnosis(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY, (data) => {
    SocketService.listenTicketClinicUpdateTicketRadiology(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_PRODUCT_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketProductList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_PROCEDURE_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketProcedureList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_RADIOLOGY_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketRadiologyList(data)
  })
}

export const reconnectSocket = () => {
  SocketBase.disconnect()
  SocketBase.auth = { token: localStorage.getItem(REFRESH_TOKEN) }
  SocketBase.connect()
}

export { SocketBase }
