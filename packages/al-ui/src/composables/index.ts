import {
  type ConfigProviderProps,
  createDiscreteApi,
  type DiscreteApiOptions,
  useDialog as useNaiveDialog,
  useLoadingBar as useNaiveLoadingBar,
  useMessage as useNaiveMessage,
  useModal as useNaiveModal,
  useNotification as useNaiveNotification,
} from 'naive-ui'
import type { ComputedRef } from 'vue'

/** Provider-bound services. These throw a useful upstream error when UiProvider is absent. */
export const useDialog = useNaiveDialog
export const useLoadingBar = useNaiveLoadingBar
export const useMessages = useNaiveMessage
export const useModal = useNaiveModal
export const useNotifications = useNaiveNotification

export interface StandaloneServicesOptions {
  configProviderProps?: ComputedRef<ConfigProviderProps>
  discrete?: DiscreteApiOptions
}

/**
 * Escape hatch for non-component hosts. Pass reactive configProviderProps from
 * the host theme service so detached roots stay visually synchronized.
 */
export function createUiServices(options: StandaloneServicesOptions = {}) {
  return createDiscreteApi(['dialog', 'loadingBar', 'message', 'modal', 'notification'], {
    configProviderProps: options.configProviderProps,
    ...options.discrete,
  })
}

export type {
  DialogApi,
  DialogOptions,
  LoadingBarApi,
  MessageApi,
  MessageOptions,
  ModalApi,
  ModalOptions,
  NotificationApi,
  NotificationOptions,
} from 'naive-ui'
