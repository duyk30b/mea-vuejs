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

  SocketBase.on(SOCKET_EVENT.DISTRIBUTOR_UPSERT, (data) => {
    SocketService.listenDistributorUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.CUSTOMER_UPSERT, (data) => {
    SocketService.listenCustomerUpsert(data)
  })

  SocketBase.on(SOCKET_EVENT.PRODUCT_LIST_CHANGE, (data) => {
    SocketService.listenProductListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.BATCH_LIST_CHANGE, (data) => {
    SocketService.listenBatchListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.PROCEDURE_LIST_CHANGE, (data) => {
    SocketService.listenProcedureListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.LABORATORY_LIST_CHANGE, (data) => {
    SocketService.listenLaboratoryListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.RADIOLOGY_LIST_CHANGE, (data) => {
    SocketService.listenRadiologyListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.POSITION_LIST_CHANGE, (data) => {
    SocketService.listenPositionListChange(data)
  })

  SocketBase.on(SOCKET_EVENT.DISCOUNT_LIST_CHANGE, (data) => {
    SocketService.listenDiscountListChange(data)
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

  SocketBase.on(SOCKET_EVENT.TICKET_RADIOLOGY_LIST_CHANGE, (data) => {
    SocketService.listenTicketRadiologyListChange(data)
  })
  SocketBase.on(SOCKET_EVENT.TICKET_LABORATORY_LIST_CHANGE, (data) => {
    SocketService.listenTicketLaboratoryListChange(data)
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
