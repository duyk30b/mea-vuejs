import { ref } from 'vue'

export class TicketLaboratoryGroupService {
  static refreshTime = ref<number>(Date.now())
}
