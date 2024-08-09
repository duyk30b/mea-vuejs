import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  AppointmentDetailQuery,
  AppointmentGetQuery,
  AppointmentListQuery,
  type AppointmentPaginationQuery,
} from './appointment.dto'
import { Appointment, AppointmentStatus, AppointmentType } from './appointment.model'

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

  static async createOne(body: {
    customerId: number
    registeredAt: number
    reason: string
    appointmentType: AppointmentType
    appointmentStatus: AppointmentStatus
  }) {
    const response = await AxiosInstance.post('/appointment/create', body)
    const { data } = response.data as BaseResponse<{ appointment: any }>
    return Appointment.from(data.appointment)
  }

  static async updateOne(
    id: number,
    body: {
      customerId: number
      registeredAt: number
      reason: string
      appointmentStatus: AppointmentStatus
    }
  ) {
    const response = await AxiosInstance.patch(`/appointment/update/${id}`, body)
    const { data } = response.data as BaseResponse<{ appointment: any }>
    return Appointment.from(data.appointment)
  }

  static async delete(id: number) {
    const response = await AxiosInstance.delete(`/appointment/delete/${id}`)
    const { data } = response.data as BaseResponse<{ appointmentId: any }>
    return data
  }
}
