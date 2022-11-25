import { GroupedCache } from '../../lib/DataSources'
import { GroupValues, User } from './Types'
import { cloneDeep } from './cloneUtils'

export class DummyGroupedCache implements GroupedCache<User> {
  private value: User | undefined
  groupValues: GroupValues

  name = 'Dummy cache'
  isCache = true

  constructor(returnedValues: GroupValues) {
    this.groupValues = cloneDeep(returnedValues)
  }

  deleteGroup(group: string) {
    delete this.groupValues[group]
    return Promise.resolve()
  }

  getFromGroup(key: string, group: string) {
    return Promise.resolve(this.groupValues[group]?.[key])
  }
  setForGroup(key: string, value: User | null, group: string) {
    if (!this.groupValues[group]) {
      this.groupValues[group] = {}
    }
    this.groupValues[group][key] = value

    return Promise.resolve()
  }

  get() {
    return Promise.resolve(this.value)
  }

  clear(): Promise<void> {
    this.value = undefined
    this.groupValues = {}
    return Promise.resolve(undefined)
  }

  delete(): Promise<void> {
    this.value = undefined
    return Promise.resolve(undefined)
  }

  set(_key: string, value: User | null): Promise<void> {
    this.value = value ?? undefined
    return Promise.resolve(undefined)
  }
}
