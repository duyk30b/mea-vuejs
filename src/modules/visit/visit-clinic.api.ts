import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { Customer } from '../customer'

export class VisitClinicApi {
  static async registerWithExistCustomer(body: { customerId: number; registeredAt: number }) {
    const response = await AxiosInstance.post('/visit/clinic/register-with-exist-customer', body)
    const { data } = response.data as BaseResponse<{ visit: any }>
  }

  static async registerWithNewCustomer(body: { customer: Customer; registeredAt: number }) {
    const { customer } = body
    const response = await AxiosInstance.post('/visit/clinic/register-with-new-customer', {
      registeredAt: body.registeredAt,
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        birthday: customer.birthday,
        gender: customer.gender,
        identityCard: customer.identityCard, // số căn cước
        addressProvince: customer.addressProvince,
        addressDistrict: customer.addressDistrict,
        addressWard: customer.addressWard,
        addressStreet: customer.addressStreet,
        relative: customer.relative, // người thân
        healthHistory: customer.healthHistory, // Tiền sử bệnh
        note: customer.note,
        isActive: customer.isActive, // Trạng thái
      },
    })
    const { data } = response.data as BaseResponse<{ visit: any }>
  }

  static async startCheckup(params: { visitId: number }) {
    const response = await AxiosInstance.post(`visit/clinic/start-checkup/${params.visitId}`)
    const { data } = response.data as BaseResponse<{ visitBasic: any }>
  }
}
