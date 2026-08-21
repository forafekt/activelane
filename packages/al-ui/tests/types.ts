import type { ComponentId, DataTableColumns, FormRules, TreeOption } from '../src'
import { Button, componentCatalog, getCatalogComponent } from '../src'

const id: ComponentId = 'button'
const component = getCatalogComponent(id)
const columns: DataTableColumns<{ id: number }> = [{ key: 'id', title: 'ID' }]
const rules: FormRules = { name: { required: true, message: 'Required' } }
const nodes: TreeOption[] = [{ key: 'root', label: 'Root' }]
void [Button, component, componentCatalog[id], columns, rules, nodes]
