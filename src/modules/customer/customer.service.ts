import { CustomerDB } from '../../core/indexed-db/repository/customer.repository'
import { Customer } from './customer.model'

export class CustomerService {
  static async search(text: string) {
    if (!text) return []
    const objects = await CustomerDB.findManyBy({
      isActive: 1,
      $OR: [{ phone: { LIKE: text } }, { fullName: { LIKE: text } }],
      deletedAt: { IS_NULL: true },
    })
    return Customer.fromList(objects)
  }
}
