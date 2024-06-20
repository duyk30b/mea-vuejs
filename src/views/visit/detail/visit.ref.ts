import { ref } from 'vue'
import { Visit } from '../../../modules/visit'

const visit = ref<Visit>(Visit.blank())
// watchEffect(() => {
//   const proceduresMoney = (visit.value.visitProcedureList || []).reduce((acc, item) => {
//     return acc + item.quantity * item.actualPrice
//   }, 0)
//   const productsMoney = (visit.value.visitProductList || []).reduce((acc, item) => {
//     return acc + item.quantity * item.actualPrice
//   }, 0)

//   visit.value.proceduresMoney = proceduresMoney
//   visit.value.productsMoney = productsMoney
//   visit.value.totalMoney = productsMoney + proceduresMoney
// })

export { visit }
