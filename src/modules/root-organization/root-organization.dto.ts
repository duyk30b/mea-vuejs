import { OmitClass, PickClass } from '../../utils'

export class RootOrganizationGetQuery {
  page?: number
  limit?: number
  relation?: {
    organizationPaymentList?: boolean
    userList?: boolean
  }

  filter?: { id: number }
  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<RootOrganizationGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RootOrganizationPaginationQuery extends RootOrganizationGetQuery { }
export class RootOrganizationListQuery extends OmitClass(RootOrganizationGetQuery, ['page']) { }
export class RootOrganizationDetailQuery extends PickClass(RootOrganizationGetQuery, [
  'relation',
]) { }

export class RootUserGetQuery {
  page?: number
  limit?: number
  relation?: {
    organization?: boolean
    role?: boolean
  }

  filter?: { id: number }
  sort?: { id?: 'ASC' | 'DESC' }

  static toQuery(instance: Partial<RootUserGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class RootUserPaginationQuery extends RootUserGetQuery { }
export class RootUserListQuery extends OmitClass(RootUserGetQuery, ['page']) { }
export class RootUserDetailQuery extends PickClass(RootUserGetQuery, ['relation']) { }
