import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Customer } from '../customer'
import type { TicketType } from '../ticket'
import {
  AppointmentDetailQuery,
  AppointmentGetQuery,
  AppointmentListQuery,
  type AppointmentPaginationQuery,
} from './appointment.dto'
import { Appointment } from './appointment.model'

export class AppointmentApi {
  static async pagination(options: AppointmentPaginationQuery) {
    const params = AppointmentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/appointment/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Appointment.fromList(data),
    }
  }

  static async list(options: AppointmentListQuery) {
    const params = AppointmentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/appointment/list', { params })
    const { data } = response.data as BaseResponse<any[]>
    return Appointment.fromList(data)
  }

  static async detail(id: number, options: AppointmentDetailQuery): Promise<Appointment> {
    const params = AppointmentGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/appointment/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ appointment: any }>
    return Appointment.from(data.appointment)
  }

  static async createOne(body: { appointment: Appointment; newCustomer?: Customer }) {
    const { appointment, newCustomer } = body
    const response = await AxiosInstance.post('/appointment/create', {
      customerId: appointment.customerId,
      appointmentStatus: appointment.appointmentStatus,
      customer:
        newCustomer && newCustomer.id === 0
          ? {
            fullName: newCustomer.fullName,
            customerCode: newCustomer.customerCode,
            phone: newCustomer.phone,
            facebook: newCustomer.facebook || '',
            zalo: newCustomer.zalo || '',
            customerSourceId: newCustomer.customerSourceId || 0,
            birthday: newCustomer.birthday,
            yearOfBirth: newCustomer.yearOfBirth,
            gender: newCustomer.gender,
            addressProvince: newCustomer.addressProvince,
            addressWard: newCustomer.addressWard,
            addressStreet: newCustomer.addressStreet,
            relative: newCustomer.relative,
            healthHistory: newCustomer.healthHistory,
            note: newCustomer.note,
            isActive: newCustomer.isActive,
          }
          : undefined,
      fromTicketId: appointment.fromTicketId,
      registeredAt: appointment.registeredAt,
      reason: appointment.reason,
      customerSourceId: appointment.customerSourceId,
    })
    const { data } = response.data as BaseResponse<{ appointment: any }>
    return Appointment.from(data.appointment)
  }

  static async updateOne(id: number, body: { appointment: Appointment }) {
    const response = await AxiosInstance.patch(`/appointment/update/${id}`, {
      registeredAt: body.appointment.registeredAt,
      reason: body.appointment.reason,
      customerSourceId: body.appointment.customerSourceId,
      cancelReason: body.appointment.cancelReason,
      appointmentStatus: body.appointment.appointmentStatus,
    })
    const { data } = response.data as BaseResponse<{ appointment: any }>
    return Appointment.from(data.appointment)
  }

  static async delete(id: number) {
    const response = await AxiosInstance.delete(`/appointment/delete/${id}`)
    const { data } = response.data as BaseResponse<{ appointmentId: any }>
    return data
  }

  static async registerTicketClinic(
    appointmentId: number,
    body: { roomId: number; registeredAt: number; ticketType: TicketType },
  ) {
    const response = await AxiosInstance.post(
      `/appointment/${appointmentId}/register-ticket-clinic`,
      body,
    )
    const { data } = response.data as BaseResponse<{ appointmentId: any }>
    return data
  }
}
