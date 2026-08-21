import type { Component } from 'vue'
import DataTableView from '../blocks/DataTableView.vue'
import MasterDetail from '../blocks/MasterDetail.vue'
import PaneHeader from '../blocks/PaneHeader.vue'
import PaneSection from '../blocks/PaneSection.vue'
import PaneToolbar from '../blocks/PaneToolbar.vue'
import ResourceList from '../blocks/ResourceList.vue'
import ResourceListItem from '../blocks/ResourceListItem.vue'
import ResourceListPane from '../blocks/ResourceListPane.vue'

function defineBlockRegistry<const T extends Record<string, Component>>(
  registry: T,
): { readonly [K in keyof T]: Component } {
  return registry
}

export const workbenchBlockRegistry = defineBlockRegistry({
  DataTableView,
  MasterDetail,
  PaneHeader,
  PaneSection,
  PaneToolbar,
  ResourceList,
  ResourceListItem,
  ResourceListPane,
})
