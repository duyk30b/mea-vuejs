import { Image } from '@/modules/image/image.model'
import {
  roomDeliveryPagination,
  roomFinancePagination,
  roomTicketPaginationMapRoomId,
  ticketRoomRef,
} from '@/modules/room/room.ref'
import { Ticket } from '@/modules/ticket'
import { TicketAttribute } from '@/modules/ticket-attribute'
import { TicketBatch } from '@/modules/ticket-batch'
import {
  TicketLaboratory,
  TicketLaboratoryGroup,
  TicketLaboratoryResult,
  TicketLaboratoryService,
} from '@/modules/ticket-laboratory'
import { TicketProcedure, TicketProcedureService } from '@/modules/ticket-procedure'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketProductService } from '@/modules/ticket-product/ticket-product.service'
import { TicketRadiology, TicketRadiologyService } from '@/modules/ticket-radiology'
import { TicketReception } from '@/modules/ticket-reception'
import { TicketRegimen, TicketRegimenItem, TicketRegimenService } from '@/modules/ticket-regimen'
import { TicketUser, TicketUserService } from '@/modules/ticket-user'

export class SocketTicketService {
  static async listenSocketTicketChange(data: {
    ticketId: string
    ticketModified?: Ticket
    imageList?: { destroyedList?: Image[]; upsertedList?: Image[] }
    ticketAttribute?: { destroyedList?: TicketAttribute[]; upsertedList?: TicketAttribute[] }
    ticketUser?: { destroyedList?: TicketUser[]; upsertedList?: TicketUser[] }
    ticketReception?: { destroyedList?: TicketReception[]; upsertedList?: TicketReception[] }
    ticketProduct?: { destroyedList?: TicketProduct[]; upsertedList?: TicketProduct[] }
    ticketBatch?: { destroyedList?: TicketBatch[]; upsertedList?: TicketBatch[] }
    ticketProcedure?: { destroyedList?: TicketProcedure[]; upsertedList?: TicketProcedure[] }
    ticketRegimen?: { destroyedList?: TicketRegimen[]; upsertedList?: TicketRegimen[] }
    ticketRegimenItem?: {
      destroyedList?: TicketRegimenItem[]
      upsertedList?: TicketRegimenItem[]
    }
    ticketLaboratoryGroup?: {
      destroyedList?: TicketLaboratoryGroup[]
      upsertedList?: TicketLaboratoryGroup[]
    }
    ticketLaboratory?: { destroyedList?: TicketLaboratory[]; upsertedList?: TicketLaboratory[] }
    ticketLaboratoryResult?: {
      destroyedList?: TicketLaboratoryResult[]
      upsertedList?: TicketLaboratoryResult[]
    }
    ticketRadiology?: { destroyedList?: TicketRadiology[]; upsertedList?: TicketRadiology[] }
  }) {
    const ticketActionList: Ticket[] = [
      ticketRoomRef.value,
      ...Object.values(roomTicketPaginationMapRoomId.value).flat(),
      ...roomFinancePagination.value,
      ...roomDeliveryPagination.value,
    ]

    for (let i = 0; i < ticketActionList.length; i++) {
      const ticketAction = ticketActionList[i]
      if (ticketAction.id !== data.ticketId) continue

      if (data.ticketModified) {
        Object.assign(ticketAction, data.ticketModified)
      }

      if (data.imageList && ticketAction.imageList) {
        if (data.imageList.destroyedList?.length) {
          const idDestroyList = data.imageList.destroyedList.map((i) => i.id)
          ticketAction.imageList = ticketAction.imageList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }

        if (data.imageList.upsertedList?.length) {
          data.imageList.upsertedList.forEach((i) => {
            const temp = Image.from(i)
            const index = ticketAction.imageList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.imageList![index] = temp
            } else {
              ticketAction.imageList!.push(temp)
            }
          })
        }

        ticketAction.refreshImageMap()
      }

      if (data.ticketAttribute && ticketAction.ticketAttributeList) {
        if (data.ticketAttribute.destroyedList?.length) {
          const idDestroyList = data.ticketAttribute.destroyedList.map((i) => i.id)
          ticketAction.ticketAttributeList = ticketAction.ticketAttributeList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketAttribute.upsertedList?.length) {
          data.ticketAttribute.upsertedList.forEach((i) => {
            const temp = TicketAttribute.from(i)
            const trFind = ticketAction.ticketAttributeList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketAttributeList?.push(temp)
            }
          })
        }
        ticketAction.refreshTicketAttribute()
      }

      if (data.ticketUser && ticketAction.ticketUserList) {
        if (data.ticketUser.destroyedList?.length) {
          const idDestroyList = data.ticketUser.destroyedList.map((i) => i.id)
          ticketAction.ticketUserList = ticketAction.ticketUserList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }

        if (data.ticketUser.upsertedList?.length) {
          data.ticketUser.upsertedList.forEach((i) => {
            const temp = TicketUser.from(i)
            if (i.ticketId !== ticketAction.id) return
            const index = ticketAction.ticketUserList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.ticketUserList![index] = temp
            } else {
              ticketAction.ticketUserList!.push(temp)
            }
          })
        }

        await TicketUserService.refreshRelation(ticketAction.ticketUserList)
        ticketAction.refreshTicketUser()
      }

      if (data.ticketReception && ticketAction.ticketReceptionList) {
        if (data.ticketReception.destroyedList?.length) {
          const idDestroyList = data.ticketReception.destroyedList.map((i) => i.id)
          ticketAction.ticketReceptionList = ticketAction.ticketReceptionList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketReception.upsertedList?.length) {
          data.ticketReception.upsertedList.forEach((i) => {
            const temp = TicketReception.from(i)
            const trFind = ticketAction.ticketReceptionList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketReceptionList?.push(temp)
            }
          })
        }
      }

      if (data.ticketProduct && ticketAction.ticketProductList) {
        if (data.ticketProduct.destroyedList?.length) {
          const idDestroyList = data.ticketProduct.destroyedList.map((i) => i.id)
          ticketAction.ticketProductList = ticketAction.ticketProductList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketProduct.upsertedList?.length) {
          data.ticketProduct.upsertedList.forEach((i) => {
            const temp = TicketProduct.from(i)
            const trFind = ticketAction.ticketProductList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketProductList?.push(temp)
            }
          })
        }
        await TicketProductService.refreshRelation(ticketAction.ticketProductList)
        ticketAction.refreshTicketProduct()
      }

      if (data.ticketBatch && ticketAction.ticketBatchList) {
        if (data.ticketBatch.destroyedList?.length) {
          const idDestroyList = data.ticketBatch.destroyedList.map((i) => i.id)
          ticketAction.ticketBatchList = ticketAction.ticketBatchList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketBatch.upsertedList?.length) {
          data.ticketBatch.upsertedList.forEach((i) => {
            const temp = TicketBatch.from(i)
            const trFind = ticketAction.ticketBatchList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketBatchList?.push(temp)
            }
          })
        }
      }

      if (data.ticketProcedure && ticketAction.ticketProcedureList) {
        if (data.ticketProcedure.destroyedList?.length) {
          const idDestroyList = data.ticketProcedure.destroyedList.map((i) => i.id)
          ticketAction.ticketProcedureList = ticketAction.ticketProcedureList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketProcedure.upsertedList?.length) {
          data.ticketProcedure.upsertedList.forEach((i) => {
            const temp = TicketProcedure.from(i)
            const trFind = ticketAction.ticketProcedureList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketProcedureList?.push(temp)
            }
          })
        }
        await TicketProcedureService.refreshRelation(ticketAction.ticketProcedureList)
        ticketAction.refreshTicketProcedureAndRegimen()
      }

      if (data.ticketRegimen && ticketAction.ticketRegimenList) {
        if (data.ticketRegimen.destroyedList?.length) {
          const idDestroyList = data.ticketRegimen.destroyedList.map((i) => i.id)
          ticketAction.ticketRegimenList = ticketAction.ticketRegimenList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketRegimen.upsertedList?.length) {
          data.ticketRegimen.upsertedList.forEach((i) => {
            const temp = TicketRegimen.from(i)
            const trFind = ticketAction.ticketRegimenList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketRegimenList?.push(temp)
            }
          })
        }
        await TicketRegimenService.refreshRelation(ticketAction.ticketRegimenList)
        ticketAction.refreshTicketProcedureAndRegimen()
      }

      if (data.ticketRegimenItem && ticketAction.ticketRegimenItemList) {
        if (data.ticketRegimenItem.destroyedList?.length) {
          const idDestroyList = data.ticketRegimenItem.destroyedList.map((i) => i.id)
          ticketAction.ticketRegimenItemList = ticketAction.ticketRegimenItemList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketRegimenItem.upsertedList?.length) {
          data.ticketRegimenItem.upsertedList.forEach((i) => {
            const temp = TicketRegimenItem.from(i)
            const trFind = ticketAction.ticketRegimenItemList!.find((j) => {
              return i.id === j.id
            })
            if (trFind) {
              Object.assign(trFind, temp)
            } else {
              ticketAction.ticketRegimenItemList?.push(temp)
            }
          })
        }
        await TicketRegimenService.refreshRelationItem(ticketAction.ticketRegimenItemList)
        ticketAction.refreshTicketProcedureAndRegimen()
      }

      if (data.ticketLaboratoryGroup && ticketAction.ticketLaboratoryGroupList) {
        if (data.ticketLaboratoryGroup.destroyedList?.length) {
          const idDestroyList = data.ticketLaboratoryGroup.destroyedList.map((i) => i.id)
          ticketAction.ticketLaboratoryGroupList = ticketAction.ticketLaboratoryGroupList.filter(
            (i) => {
              return !idDestroyList.includes(i.id)
            },
          )
        }
        if (data.ticketLaboratoryGroup.upsertedList?.length) {
          data.ticketLaboratoryGroup.upsertedList?.forEach((i) => {
            const temp = TicketLaboratoryGroup.from(i)
            const index = ticketAction.ticketLaboratoryGroupList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.ticketLaboratoryGroupList![index] = temp
            } else {
              ticketAction.ticketLaboratoryGroupList!.push(temp)
            }
          })
        }
        await TicketLaboratoryService.refreshRelationGroup(ticketAction.ticketLaboratoryGroupList)
        ticketAction.refreshTicketLaboratory()
      }

      if (data.ticketLaboratory && ticketAction.ticketLaboratoryList) {
        if (data.ticketLaboratory.destroyedList?.length) {
          const idDestroyList = data.ticketLaboratory.destroyedList.map((i) => i.id)
          ticketAction.ticketLaboratoryList = ticketAction.ticketLaboratoryList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketLaboratory.upsertedList?.length) {
          data.ticketLaboratory.upsertedList?.forEach((i) => {
            const temp = TicketLaboratory.from(i)
            const index = ticketAction.ticketLaboratoryList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.ticketLaboratoryList![index] = temp
            } else {
              ticketAction.ticketLaboratoryList!.push(temp)
            }
          })
        }
        await TicketLaboratoryService.refreshRelation(ticketAction.ticketLaboratoryList)
        ticketAction.refreshTicketLaboratory()
      }

      if (data.ticketLaboratoryResult && ticketAction.ticketLaboratoryResultList) {
        if (data.ticketLaboratoryResult.destroyedList?.length) {
          const idDestroyList = data.ticketLaboratoryResult.destroyedList.map((i) => i.id)
          ticketAction.ticketLaboratoryResultList = ticketAction.ticketLaboratoryResultList.filter(
            (i) => {
              return !idDestroyList.includes(i.id)
            },
          )
        }
        if (data.ticketLaboratoryResult.upsertedList?.length) {
          data.ticketLaboratoryResult.upsertedList?.forEach((i) => {
            const temp = TicketLaboratoryResult.from(i)
            const index = ticketAction.ticketLaboratoryResultList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.ticketLaboratoryResultList![index] = temp
            } else {
              ticketAction.ticketLaboratoryResultList!.push(temp)
            }
          })
        }
        await TicketLaboratoryService.refreshRelationResult(ticketAction.ticketLaboratoryResultList)
        ticketAction.refreshTicketLaboratory()
      }

      if (data.ticketRadiology && ticketAction.ticketRadiologyList) {
        if (data.ticketRadiology.destroyedList?.length) {
          const idDestroyList = data.ticketRadiology.destroyedList.map((i) => i.id)
          ticketAction.ticketRadiologyList = ticketAction.ticketRadiologyList.filter((i) => {
            return !idDestroyList.includes(i.id)
          })
        }
        if (data.ticketRadiology.upsertedList?.length) {
          data.ticketRadiology.upsertedList?.forEach((i) => {
            const temp = TicketRadiology.from(i)
            const index = ticketAction.ticketRadiologyList!.findIndex((j) => {
              return i.id === j.id
            })
            if (index !== -1) {
              ticketAction.ticketRadiologyList![index] = temp
            } else {
              ticketAction.ticketRadiologyList!.push(temp)
            }
          })
        }
        await TicketRadiologyService.refreshRelation(ticketAction.ticketRadiologyList)
        ticketAction.refreshTicketRadiology()
      }
    }
  }
}
