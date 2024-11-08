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

  SocketBase.on(SOCKET_EVENT.ORGANIZATION_UPDATE, (data) => {
    SocketService.listenOrganizationUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.SETTING_RELOAD, (data) => {
    SocketService.listenSettingReload(data)
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

  SocketBase.on(SOCKET_EVENT.TICKET_CREATE, (data) => {
    SocketService.listenTicketCreate(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE, (data) => {
    SocketService.listenTicketUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_DESTROY, (data) => {
    SocketService.listenTicketDestroy(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_DIAGNOSIS_BASIC, (data) => {
    SocketService.listenTicketUpdateTicketDiagnosisBasic(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_DIAGNOSIS_SPECIAL, (data) => {
    SocketService.listenTicketUpdateTicketDiagnosisSpecial(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_PROCEDURE_LIST, (data) => {
    SocketService.listenTicketUpdateTicketProcedureList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_PRODUCT_CONSUMABLE_LIST, (data) => {
    SocketService.listenTicketUpdateTicketProductConsumableList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_PRODUCT_PRESCRIPTION_LIST, (data) => {
    SocketService.listenTicketUpdateTicketProductPrescriptionList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_RADIOLOGY_RESULT, (data) => {
    SocketService.listenTicketUpdateTicketRadiologyResult(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_RADIOLOGY_LIST, (data) => {
    SocketService.listenTicketUpdateTicketRadiologyList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_UPDATE_TICKET_USER_LIST, (data) => {
    SocketService.listenTicketUpdateTicketUserList(data)
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
