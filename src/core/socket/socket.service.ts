import { MeService } from '../../modules/_me/me.service'
import { useMeStore } from '../../modules/_me/me.store'
import { Batch } from '../../modules/batch'
import { InteractType } from '../../modules/commission'
import { Customer } from '../../modules/customer'
import { Distributor, DistributorService } from '../../modules/distributor'
import { Organization } from '../../modules/organization'
import { Product, ProductService } from '../../modules/product'
import { Ticket } from '../../modules/ticket'
import { TicketAttribute } from '../../modules/ticket-attribute'
import { ticketClinicPagination, ticketClinicRef } from '../../modules/ticket-clinic'
import { TicketLaboratory } from '../../modules/ticket-laboratory'
import { TicketProcedure } from '../../modules/ticket-procedure'
import { TicketProduct, TicketProductType } from '../../modules/ticket-product'
import { TicketRadiology } from '../../modules/ticket-radiology'
import { TicketUser } from '../../modules/ticket-user'
import { arrayToKeyValue, DArray } from '../../utils'
import { BatchDB } from '../indexed-db/repository/batch.repository'
import { CustomerDB } from '../indexed-db/repository/customer.repository'
import { ProductDB } from '../indexed-db/repository/product.repository'

export class SocketService {
  static listenServerEmitDemo(data: any) {
    console.log('🚀 ~ file: socket.service.ts:3 ~ listenServerEmitDemo ~ data:', data)
  }

  static async listenOrganizationUpdate(data: { organization: Organization }) {
    const organization = Organization.from(data.organization)
    useMeStore().organization = organization
  }

  static async listenSettingReload(data: any) {
    await MeService.reloadSetting()
  }

  static async listenCustomerUpsert(data: { customer: any }) {
    const customer = Customer.from(data.customer)
    await CustomerDB.upsertOne(customer)

    if (ticketClinicRef.value.customerId === customer.id) {
      ticketClinicRef.value.customer = customer
    }
  }

  static async listenDistributorUpsert(data: { distributor: any }) {
    const distributor = Distributor.from(data.distributor)
    const findIndex = DistributorService.distributorAll.findIndex((i) => {
      return i.id === distributor.id
    })
    if (findIndex !== -1) {
      DistributorService.distributorAll[findIndex] = distributor
    } else {
      DistributorService.distributorAll.push(distributor)
    }
  }

  static async listenProductUpsert(data: { product: any }) {
    const product = Product.from(data.product)
    await ProductDB.upsertOne(product)
  }

  static async listenProductListUpdate(data: { productList: any[] }) {
    const productList = Product.fromList(data.productList)
    await ProductDB.upsertMany(productList)
  }

  static async listenBatchUpsert(data: { batch: any }) {
    const batch = Batch.from(data.batch)
    await BatchDB.upsertOne(batch)
  }

  static async listenBatchListUpdate(data: { batchList: any[] }) {
    const batchList = Batch.fromList(data.batchList)
    await BatchDB.upsertMany(batchList)
  }

  static getTicketAction(ticketId: number) {
    const ticketAction: Ticket[] = []
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === ticketId)
    if (ticketFind) {
      ticketAction.push(ticketFind)
    }
    if (ticketClinicRef.value.id === ticketId) {
      ticketAction.push(ticketClinicRef.value)
    }
    return ticketAction
  }

  static async listenTicketClinicChange(data: {
    type: 'CREATE' | 'UPDATE' | 'DESTROY'
    ticket: any
  }) {
    const ticket = Ticket.from(data.ticket)
    if (ticketClinicRef.value.id === ticket.id) {
      Object.assign(ticketClinicRef.value, ticket)
    }

    const findIndex = ticketClinicPagination.value.findIndex((i) => i.id === ticket.id)
    if (data.type === 'CREATE' || data.type === 'UPDATE') {
      if (findIndex !== -1) {
        Object.assign(ticketClinicPagination.value[findIndex], ticket)
      } else {
        ticketClinicPagination.value.unshift(ticket)
      }
    }
    if (data.type === 'DESTROY') {
      if (findIndex !== -1) {
        ticketClinicPagination.value.splice(findIndex, 1)
      }
    }
  }

  static async listenTicketClinicUpdateTicketAttributeList(data: {
    ticketId: number
    ticketAttributeList: any[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      ticket.ticketAttributeList = TicketAttribute.fromList(data.ticketAttributeList)
      ticket.ticketAttributeMap = TicketAttribute.basicMap(data.ticketAttributeList)
    })
  }

  static async listenTicketClinicChangeTicketUserList(data: {
    ticketId: number
    interactType: InteractType
    ticketItemId: number
    ticketUserReplaceList?: TicketUser[]
    ticketUserDestroyList?: TicketUser[]
    ticketUserUpdateList?: TicketUser[]
    ticketUserInsertList?: TicketUser[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketUserList) return
      const ticketUserOtherList = ticket.ticketUserList.filter((i) => {
        if (i.interactType !== data.interactType) return true
        if (i.ticketItemId !== data.ticketItemId) return true
        return false
      })
      let ticketUserActionList = ticket.ticketUserList.filter((i) => {
        if (i.interactType !== data.interactType) return false
        if (i.ticketItemId !== data.ticketItemId) return false
        return true
      })

      if (data.ticketUserReplaceList) {
        ticketUserActionList = TicketUser.fromList(data.ticketUserReplaceList)
      }
      // Destroy phải  xử lý trước
      if (data.ticketUserDestroyList) {
        const roleIdList = data.ticketUserDestroyList.map((i) => i.roleId)
        ticketUserActionList = ticketUserActionList.filter((i) => !roleIdList.includes(i.roleId))
      }
      if (data.ticketUserUpdateList) {
        const roleIdList = data.ticketUserUpdateList.map((i) => i.roleId)
        ticketUserActionList = ticketUserActionList
          .filter((i) => !roleIdList.includes(i.roleId))
          .concat(TicketUser.fromList(data.ticketUserUpdateList))
      }
      if (data.ticketUserInsertList) {
        ticketUserActionList = ticketUserActionList.concat(
          TicketUser.fromList(data.ticketUserInsertList)
        )
      }
      ticket.ticketUserList = ticketUserOtherList.concat(ticketUserActionList)
      ticket.refreshTicketUserGroup()
    })
  }

  static async listenTicketClinicChangeTicketProcedureList(data: {
    ticketId: number
    ticketProcedureInsert?: TicketProcedure
    ticketProcedureUpdate?: TicketProcedure
    ticketProcedureDestroy?: TicketProcedure
    ticketProcedureList?: TicketProcedure[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketProcedureList) return
      if (data.ticketProcedureInsert) {
        const indexInsert = ticket.ticketProcedureList.findIndex((i) => {
          return data.ticketProcedureInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketProcedureList?.push(TicketProcedure.from(data.ticketProcedureInsert))
        }
      }
      if (data.ticketProcedureUpdate) {
        const indexUpdate = ticket.ticketProcedureList.findIndex((i) => {
          return data.ticketProcedureUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          Object.assign(
            ticket.ticketProcedureList[indexUpdate],
            TicketProcedure.from(data.ticketProcedureUpdate)
          )
        }
      }
      if (data.ticketProcedureDestroy) {
        const indexDestroy = ticket.ticketProcedureList.findIndex((i) => {
          return i.id === data.ticketProcedureDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketProcedureList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketProcedureList) {
        ticket.ticketProcedureList = TicketProcedure.fromList(data.ticketProcedureList)
      }
    })
  }

  static async listenTicketClinicChangeTicketRadiologyList(data: {
    ticketId: number
    ticketRadiologyInsert?: TicketRadiology
    ticketRadiologyUpdate?: TicketRadiology
    ticketRadiologyDestroy?: TicketRadiology
    ticketRadiologyList?: TicketRadiology[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketRadiologyList) return
      if (data.ticketRadiologyInsert) {
        const indexInsert = ticket.ticketRadiologyList.findIndex((i) => {
          return data.ticketRadiologyInsert?.id === i.id
        })
        if (indexInsert === -1) {
          ticket.ticketRadiologyList?.push(TicketRadiology.from(data.ticketRadiologyInsert))
        }
      }
      if (data.ticketRadiologyUpdate) {
        const indexUpdate = ticket.ticketRadiologyList.findIndex((i) => {
          return data.ticketRadiologyUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          Object.assign(
            ticket.ticketRadiologyList[indexUpdate],
            TicketRadiology.from(data.ticketRadiologyUpdate)
          )
        }
      }
      if (data.ticketRadiologyDestroy) {
        const indexDestroy = ticket.ticketRadiologyList.findIndex((i) => {
          return i.id === data.ticketRadiologyDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketRadiologyList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketRadiologyList) {
        ticket.ticketRadiologyList = TicketRadiology.fromList(data.ticketRadiologyList)
      }
    })
  }

  static async listenTicketClinicChangeTicketLaboratoryList(data: {
    ticketId: number
    ticketLaboratoryDestroy?: TicketLaboratory
    ticketLaboratoryUpdate?: TicketLaboratory
    ticketLaboratoryInsert?: TicketLaboratory
    ticketLaboratoryInsertList?: TicketLaboratory[]
    ticketLaboratoryList?: TicketLaboratory[]
  }) {
    const ticketAction: Ticket[] = SocketService.getTicketAction(data.ticketId)
    ticketAction.forEach((ticket) => {
      if (!ticket.ticketLaboratoryList) return
      if (data.ticketLaboratoryDestroy) {
        const indexDestroy = ticket.ticketLaboratoryList.findIndex((i) => {
          return i.id === data.ticketLaboratoryDestroy!.id
        })
        if (indexDestroy !== -1) {
          ticket.ticketLaboratoryList?.splice(indexDestroy, 1)
        }
      }
      if (data.ticketLaboratoryUpdate) {
        const indexUpdate = ticket.ticketLaboratoryList.findIndex((i) => {
          return data.ticketLaboratoryUpdate?.id === i.id
        })
        if (indexUpdate !== -1) {
          Object.assign(
            ticket.ticketLaboratoryList[indexUpdate],
            TicketLaboratory.from(data.ticketLaboratoryUpdate)
          )
        }
      }
      if (data.ticketLaboratoryInsert) {
        const indexInsert = ticket.ticketLaboratoryList.findIndex((i) => {
          return data.ticketLaboratoryInsert?.id === i.id
        })
        if (indexInsert === -1) {
          const temp = TicketLaboratory.from(data.ticketLaboratoryInsert)
          ticket.ticketLaboratoryList.push(temp)
        }
      }
      if (data.ticketLaboratoryInsertList) {
        data.ticketLaboratoryInsertList.forEach((i) => {
          const indexInsert = (ticket.ticketLaboratoryList || []).findIndex((j) => {
            return i.id === j.id
          })
          if (indexInsert === -1) {
            const temp = TicketLaboratory.from(i)
            ticket.ticketLaboratoryList?.push(temp)
          }
        })
      }

      if (data.ticketLaboratoryList) {
        ticket.ticketLaboratoryList = TicketLaboratory.fromList(data.ticketLaboratoryList)
      }
    })
  }

  static async listenTicketClinicChangeTicketProductList(data: {
    ticketId: number
    ticketProductType: TicketProductType
    ticketProductDestroy?: TicketProduct
    ticketProductUpdate?: TicketProduct
    ticketProductInsert?: TicketProduct
    ticketProductInsertList?: TicketProduct[]
    ticketProductList?: TicketProduct[]
  }) {
    const { ticketId, ticketProductType } = data
    const ticketAction: Ticket[] = SocketService.getTicketAction(ticketId)

    const productIdList: number[] = [
      data.ticketProductInsert,
      ...(data.ticketProductInsertList || []),
      ...(data.ticketProductList || []),
    ]
      .filter((i) => !!i)
      .map((i) => i.productId)

    let productMap: Record<string, Product> = {}
    if (productIdList.length) {
      const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })
      productMap = DArray.arrayToKeyValue(productList, 'id')
    }

    ticketAction.forEach(async (ticket) => {
      let ticketItemList = ticket.ticketProductList
      if (ticketProductType === TicketProductType.Consumable) {
        ticketItemList = ticket.ticketProductConsumableList
      }
      if (ticketProductType === TicketProductType.Prescription) {
        ticketItemList = ticket.ticketProductPrescriptionList
      }
      // Action
      if (ticketItemList) {
        if (data.ticketProductDestroy) {
          const indexDestroy = ticketItemList.findIndex((i) => {
            return i.id === data.ticketProductDestroy!.id
          })
          if (indexDestroy !== -1) {
            ticketItemList.splice(indexDestroy, 1)
          }
        }
        if (data.ticketProductUpdate) {
          const indexUpdate = ticketItemList.findIndex((i) => {
            return data.ticketProductUpdate?.id === i.id
          })
          if (indexUpdate !== -1) {
            Object.assign(ticketItemList[indexUpdate], TicketProduct.from(data.ticketProductUpdate))
          }
        }
        if (data.ticketProductInsert) {
          const indexInsert = ticketItemList.findIndex((i) => {
            return data.ticketProductInsert?.id === i.id
          })
          if (indexInsert === -1) {
            const temp = TicketProduct.from(data.ticketProductInsert)
            temp.product = productMap[temp.productId]
            ticketItemList.push(temp)
          }
        }
        if (data.ticketProductInsertList) {
          data.ticketProductInsertList.forEach((i) => {
            const indexInsert = (ticketItemList || []).findIndex((j) => {
              return i.id === j.id
            })
            if (indexInsert === -1) {
              const temp = TicketProduct.from(i)
              temp.product = productMap[temp.productId]
              ticketItemList?.push(temp)
            }
          })
        }
        if (data.ticketProductList) {
          ticketItemList = TicketProduct.fromList(data.ticketProductList)
          ticketItemList.forEach((i) => {
            i.product = productMap[i.productId]
          })
        }
      }

      if (ticketProductType === TicketProductType.Consumable) {
        ticket.ticketProductConsumableList = ticketItemList
      }
      if (ticketProductType === TicketProductType.Prescription) {
        ticket.ticketProductPrescriptionList = ticketItemList
      }
    })
  }

  static async listenTicketClinicUpdateTicketLaboratoryList(data: {
    ticketId: number
    ticketLaboratoryList: any[]
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      ticketFind.ticketLaboratoryList = TicketLaboratory.fromList(data.ticketLaboratoryList)
    }
    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketLaboratoryList = TicketLaboratory.fromList(
        data.ticketLaboratoryList
      )
    }
  }

  static async listenTicketClinicUpdateTicketLaboratoryResult(data: {
    ticketId: number
    ticketLaboratory: any
  }) {
    const ticketFind = ticketClinicPagination.value.find((i) => i.id === data.ticketId)
    if (ticketFind) {
      const ticketLaboratoryFind = (ticketFind.ticketLaboratoryList || []).find((i) => {
        return i.id === data.ticketLaboratory.id
      })
      if (ticketLaboratoryFind) {
        Object.assign(ticketLaboratoryFind, TicketLaboratory.from(data.ticketLaboratory))
      }
    }

    if (ticketClinicRef.value.id === data.ticketId) {
      ticketClinicRef.value.ticketLaboratoryList ||= []
      const ticketLaboratoryFind = ticketClinicRef.value.ticketLaboratoryList.find((i) => {
        return i.id === data.ticketLaboratory.id
      })
      if (ticketLaboratoryFind) {
        Object.assign(ticketLaboratoryFind, TicketLaboratory.from(data.ticketLaboratory))
      } else {
        ticketClinicRef.value.ticketLaboratoryList.push(
          TicketLaboratory.from(data.ticketLaboratory)
        )
      }
    }
  }
}
