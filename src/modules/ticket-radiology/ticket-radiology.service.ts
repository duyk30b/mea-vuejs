import { ref } from 'vue'
import { TicketRadiology } from './ticket-radiology.model'

export class TicketRadiologyService {
  static refreshTime = ref<number>(Date.now())
}
