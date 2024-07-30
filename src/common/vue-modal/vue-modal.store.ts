import { reactive } from 'vue'
import { randomId } from '../../utils'

export interface IModalData {
  type: 'confirm' | 'alert'
  title: string
  content: string | string[]
  show: boolean
  onOk: Function
  onCancel: Function
  okText: string
  cancelText: string
}

const data = reactive<Record<string, IModalData>>({})

const add = (
  type: 'confirm' | 'alert',
  options: {
    title: string
    content: string | string[]
    onOk?: Function
    onCancel?: Function
    okText?: string
    cancelText?: string
  }
) => {
  const key = randomId()
  const funcEmpty = () => {}

  data[key] = {
    type,
    title: options.title,
    content: options.content,
    show: false,
    onOk: options.onOk || funcEmpty,
    onCancel: options.onCancel || funcEmpty,
    okText: options.okText || 'Xác nhận',
    cancelText: options.cancelText || 'Hủy bỏ',
  }
  setTimeout(() => {
    data[key].show = true
  }, 0)
}

const confirm = (options: {
  title: string
  content: string | string[]
  onOk?: Function
  onCancel?: Function
  okText?: string
  cancelText?: string
}) => {
  add('confirm', options)
}

const alert = (options: {
  title: string
  content: string | string[]
  onOk?: Function
  okText?: string
}) => {
  add('alert', options)
}

const remove = (key: string) => {
  data[key].show = false
  setTimeout(() => {
    delete ModalStore.data[key]
  }, 0)
}

export const ModalStore = { data, confirm, alert, remove }
