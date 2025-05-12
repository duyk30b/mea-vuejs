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

  SocketBase.on(SOCKET_EVENT.ORGANIZATION_UPDATE, (data) => {
    SocketService.listenOrganizationUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.SETTING_RELOAD, (data) => {
    SocketService.listenSettingReload(data)
  })

  SocketBase.on(SOCKET_EVENT.CUSTOMER_UPSERT, (data) => {
    SocketService.listenCustomerUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.DISTRIBUTOR_UPSERT, (data) => {
    SocketService.listenDistributorUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.PRODUCT_UPSERT, (data) => {
    SocketService.listenProductUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.PRODUCT_LIST_UPDATE, (data) => {
    SocketService.listenProductListUpdate(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE, (data) => {
    SocketService.listenTicketClinicChange(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_UPDATE_TICKET_ATTRIBUTE_LIST, (data) => {
    SocketService.listenTicketClinicUpdateTicketAttributeList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_USER_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketUserList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_PROCEDURE_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketProcedureList(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_TICKET_RADIOLOGY_LIST, (data) => {
    SocketService.listenTicketClinicChangeTicketRadiologyList(data)
  })
  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_LABORATORY, (data) => {
    SocketService.listenTicketClinicChangeLaboratory(data)
  })

  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_PRESCRIPTION, (data) => {
    SocketService.listenTicketClinicChangePrescription(data)
  })
  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_CONSUMABLE, (data) => {
    SocketService.listenTicketClinicChangeConsumable(data)
  })
  SocketBase.on(SOCKET_EVENT.TICKET_CLINIC_CHANGE_BATCH, (data) => {
    SocketService.listenTicketClinicChangeBatch(data)
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
