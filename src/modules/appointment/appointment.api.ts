import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import type { TicketType } from '../ticket'
import {
  AppointmentDetailQuery,
  AppointmentGetQuery,
  AppointmentListQuery,
  type AppointmentPaginationQuery,
} from './appointment.dto'
import { Appointment, AppointmentStatus } from './appointment.model'

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

  static async createOne(appointment: Appointment) {
    const response = await AxiosInstance.post('/appointment/create', {
      customerId: appointment.customerId,
      appointmentStatus: appointment.appointmentStatus,
      customer:
        appointment.customerId === 0 && appointment.customer
          ? {
              fullName: appointment.customer.fullName,
              phone: appointment.customer.phone,
              facebook: appointment.customer.facebook || '',
              zalo: appointment.customer.zalo || '',
              customerSourceId: appointment.customer.customerSourceId || 0,
              birthday: appointment.customer.birthday,
              yearOfBirth: appointment.customer.yearOfBirth,
              gender: appointment.customer.gender,
              addressProvince: appointment.customer.addressProvince,
              addressDistrict: appointment.customer.addressDistrict,
              addressWard: appointment.customer.addressWard,
              addressStreet: appointment.customer.addressStreet,
              relative: appointment.customer.relative,
              healthHistory: appointment.customer.healthHistory,
              note: appointment.customer.note,
              isActive: appointment.customer.isActive,
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

  static async updateOne(id: number, appointment: Appointment) {
    const response = await AxiosInstance.patch(`/appointment/update/${id}`, {
      registeredAt: appointment.registeredAt,
      reason: appointment.reason,
      customerSourceId: appointment.customerSourceId,
      cancelReason: appointment.cancelReason,
      appointmentStatus: appointment.appointmentStatus,
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
    body: { registeredAt: number; ticketType: TicketType },
  ) {
    const response = await AxiosInstance.post(
      `/appointment/${appointmentId}/register-ticket-clinic`,
      body,
    )
    const { data } = response.data as BaseResponse<{ appointmentId: any }>
    return data
  }
}
