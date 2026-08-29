import type { Component } from 'vue'
import * as Blocks from './blocks'
import * as Components from './components'

export const componentIds = [
  'alert',
  'auto-complete',
  'avatar',
  'avatar-group',
  'badge',
  'breadcrumb',
  'breadcrumb-item',
  'button',
  'button-group',
  'calendar',
  'card',
  'carousel',
  'cascader',
  'checkbox',
  'checkbox-group',
  'code',
  'collapse',
  'collapse-item',
  'color-picker',
  'countdown',
  'data-table',
  'date-picker',
  'descriptions',
  'dialog',
  'divider',
  'drawer',
  'dropdown',
  'dynamic-input',
  'dynamic-tags',
  'ellipsis',
  'empty',
  'flex',
  'form',
  'form-item',
  'grid',
  'grid-item',
  'icon',
  'icon-button',
  'image',
  'input',
  'input-number',
  'otp-input',
  'layout',
  'list',
  'menu',
  'mention',
  'modal',
  'number-animation',
  'page-header',
  'pagination',
  'popconfirm',
  'popover',
  'progress',
  'qr-code',
  'radio',
  'radio-group',
  'rate',
  'result',
  'scrollbar',
  'select',
  'skeleton',
  'slider',
  'space',
  'spinner',
  'split',
  'statistic',
  'steps',
  'switch',
  'table',
  'tabs',
  'tag',
  'text',
  'time-picker',
  'timeline',
  'tooltip',
  'transfer',
  'tree',
  'tree-select',
  'upload',
  'virtual-list',
] as const

export type ComponentId = (typeof componentIds)[number]

export const componentCatalog: Readonly<Record<ComponentId, Component>> = {
  alert: Components.Alert,
  'auto-complete': Components.AutoComplete,
  avatar: Components.Avatar,
  'avatar-group': Components.AvatarGroup,
  badge: Components.Badge,
  breadcrumb: Components.Breadcrumb,
  'breadcrumb-item': Components.BreadcrumbItem,
  button: Components.Button,
  'button-group': Components.ButtonGroup,
  calendar: Components.Calendar,
  card: Components.Card,
  carousel: Components.Carousel,
  cascader: Components.Cascader,
  checkbox: Components.Checkbox,
  'checkbox-group': Components.CheckboxGroup,
  code: Components.Code,
  collapse: Components.Collapse,
  'collapse-item': Components.CollapseItem,
  'color-picker': Components.ColorPicker,
  countdown: Components.Countdown,
  'data-table': Components.DataTable,
  'date-picker': Components.DatePicker,
  descriptions: Components.Descriptions,
  dialog: Components.Dialog,
  divider: Components.Divider,
  drawer: Components.Drawer,
  dropdown: Components.Dropdown,
  'dynamic-input': Components.DynamicInput,
  'dynamic-tags': Components.DynamicTags,
  ellipsis: Components.Ellipsis,
  empty: Components.Empty,
  flex: Components.Flex,
  form: Components.Form,
  'form-item': Components.FormItem,
  grid: Components.Grid,
  'grid-item': Components.GridItem,
  icon: Components.Icon,
  'icon-button': Components.IconButton,
  image: Components.Image,
  input: Components.Input,
  'input-number': Components.InputNumber,
  'otp-input': Components.OtpInput,
  layout: Components.Layout,
  list: Components.List,
  menu: Components.Menu,
  mention: Components.Mention,
  modal: Components.Modal,
  'number-animation': Components.NumberAnimation,
  'page-header': Components.PageHeader,
  pagination: Components.Pagination,
  popconfirm: Components.Popconfirm,
  popover: Components.Popover,
  progress: Components.Progress,
  'qr-code': Components.QrCode,
  radio: Components.Radio,
  'radio-group': Components.RadioGroup,
  rate: Components.Rate,
  result: Components.Result,
  scrollbar: Components.Scrollbar,
  select: Components.Select,
  skeleton: Components.Skeleton,
  slider: Components.Slider,
  space: Components.Space,
  spinner: Components.Spinner,
  split: Components.Split,
  statistic: Components.Statistic,
  steps: Components.Steps,
  switch: Components.Switch,
  table: Components.Table,
  tabs: Components.Tabs,
  tag: Components.Tag,
  text: Components.Text,
  'time-picker': Components.TimePicker,
  timeline: Components.Timeline,
  tooltip: Components.Tooltip,
  transfer: Components.Transfer,
  tree: Components.Tree,
  'tree-select': Components.TreeSelect,
  upload: Components.Upload,
  'virtual-list': Components.VirtualList,
}

export const blockIds = [
  'empty-state-panel',
  'property-row',
  'search-field',
  'status-indicator',
  'toolbar',
  'toolbar-group',
] as const

export type BlockId = (typeof blockIds)[number]

export const blockCatalog: Readonly<Record<BlockId, Component>> = {
  'empty-state-panel': Blocks.EmptyStatePanel,
  'property-row': Blocks.PropertyRow,
  'search-field': Blocks.SearchField,
  'status-indicator': Blocks.StatusIndicator,
  toolbar: Blocks.Toolbar,
  'toolbar-group': Blocks.ToolbarGroup,
}

export type ComponentCatalog = typeof componentCatalog

export type BlockCatalog = typeof blockCatalog

export const catalogEntries = [
  ...Object.keys(componentCatalog).map((id) => ({
    id: id as ComponentId,
    kind: 'component' as const,
  })),
  ...Object.keys(blockCatalog).map((id) => ({ id: id as BlockId, kind: 'block' as const })),
] as const

export function getCatalogComponent<K extends ComponentId>(id: K): ComponentCatalog[K] {
  return componentCatalog[id]
}

export function getCatalogBlock<K extends BlockId>(id: K): BlockCatalog[K] {
  return blockCatalog[id]
}

export function getComponent<K extends ComponentId>(id: K): ComponentCatalog[K] {
  return componentCatalog[id]
}

export function getBlock<K extends BlockId>(id: K): BlockCatalog[K] {
  return blockCatalog[id]
}
