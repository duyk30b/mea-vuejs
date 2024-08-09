import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
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

  static async delete(id: number) {
    const response = await AxiosInstance.delete(`/appointment/delete/${id}`)
    const { data } = response.data as BaseResponse<{ appointmentId: any }>
    return data
  }
}
