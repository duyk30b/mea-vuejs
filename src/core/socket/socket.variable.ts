export enum SOCKET_EVENT {
  SERVER_EMIT_DEMO = 'SERVER_EMIT_DEMO',
  SERVER_EMIT_TICKET_CREATE = 'SERVER_EMIT_TICKET_CREATE',
  CLIENT_EMIT_TICKET_CREATE = 'CLIENT_EMIT_TICKET_CREATE',

  ORGANIZATION_UPDATE = 'ORGANIZATION_UPDATE',
  SETTING_RELOAD = 'SETTING_RELOAD',

  DISTRIBUTOR_UPSERT = 'DISTRIBUTOR_UPSERT',
  CUSTOMER_UPSERT = 'CUSTOMER_UPSERT',
  PRODUCT_UPSERT = 'PRODUCT_UPSERT',
  PRODUCT_LIST_UPDATE = 'PRODUCT_LIST_UPDATE',
  BATCH_UPSERT = 'BATCH_UPSERT',
  BATCH_LIST_UPDATE = 'BATCH_LIST_UPDATE',
  PROCEDURE_UPSERT = 'PROCEDURE_UPSERT',

  TICKET_CLINIC_CREATE = 'TICKET_CLINIC_CREATE',
  TICKET_CLINIC_UPDATE = 'TICKET_CLINIC_UPDATE',
  TICKET_CLINIC_DESTROY = 'TICKET_CLINIC_DESTROY',
  TICKET_CLINIC_UPDATE_TICKET_DIAGNOSIS_BASIC = 'TICKET_CLINIC_UPDATE_TICKET_DIAGNOSIS_BASIC',
  TICKET_CLINIC_UPDATE_TICKET_DIAGNOSIS_SPECIAL = 'TICKET_CLINIC_UPDATE_TICKET_DIAGNOSIS_SPECIAL',
  TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST = 'TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST',
  TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE_LIST = 'TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE_LIST',
  TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION_LIST = 'TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION_LIST',
  TICKET_CLINIC_UPDATE_TICKET_PARACLINICAL_LIST = 'TICKET_CLINIC_UPDATE_TICKET_PARACLINICAL_LIST',
  TICKET_CLINIC_UPDATE_TICKET_PARACLINICAL_RESULT = 'TICKET_CLINIC_UPDATE_TICKET_PARACLINICAL_RESULT',
  TICKET_CLINIC_UPDATE_TICKET_USER_LIST = 'TICKET_CLINIC_UPDATE_TICKET_USER_LIST',
}
