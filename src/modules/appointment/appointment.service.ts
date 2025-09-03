import { ProcedureService } from '../procedure'
import type { Appointment } from './appointment.model'

export class AppointmentService {
  static async refreshProcedure(appointmentList: Appointment[]) {
    const procedureMap = await ProcedureService.getMap()

    appointmentList.forEach((appointment) => {
      if (appointment.ticketProcedure) {
        appointment.ticketProcedure.procedure =
          procedureMap[appointment.ticketProcedure.procedureId]

        if (appointment.ticketProcedure?.ticketProcedureItemList?.length) {
          appointment.ticketProcedureItem = (
            appointment.ticketProcedure?.ticketProcedureItemList || []
          ).find((i) => {
            return i.id === appointment.ticketProcedureItemId
          })
        }
      }
    })
  }
}
