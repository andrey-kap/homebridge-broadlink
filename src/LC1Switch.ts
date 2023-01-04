import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge'
import * as broadlink from 'node-broadlink'
import { S3 } from 'node-broadlink/dist/hub'

import { BroadlinkPlatform } from './platform'

export class LC1Switch {
  private services: {
    one: Service
    two?: Service
    three?: Service
  }

  private state = {
    pwr1: Boolean(this.accessory.context.device.status.pwr1),
    pwr2: Boolean(this.accessory.context.device.status.pwr2),
    pwr3: Boolean(this.accessory.context.device.status.pwr3),
  }

  constructor(
    private readonly platform: BroadlinkPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Broadlink')
      .setCharacteristic(this.platform.Characteristic.Model, 'LC1')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.device.uniqueId,
      )

    this.services = {
      one:
        this.accessory.getService('Switch One') ??
        this.accessory.addService(
          this.platform.Service.Switch,
          'Switch One',
          this.platform.api.hap.uuid.generate(
            `${this.accessory.context.device.uniqueId}-0`,
          ),
        ),
    }

    this.services.one.setCharacteristic(
      this.platform.Characteristic.Name,
      'Switch One',
    )

    this.services.one
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn('pwr1'))
      .onGet(this.getOn('pwr1'))

    if (this.accessory.context.device.gangs > 1) {
      this.services.two =
        this.accessory.getService('Switch Two') ??
        this.accessory.addService(
          this.platform.Service.Switch,
          'Switch Two',
          this.platform.api.hap.uuid.generate(
            `${this.accessory.context.device.uniqueId}-1`,
          ),
        )

      this.services.two.setCharacteristic(
        this.platform.Characteristic.Name,
        'Switch Two',
      )

      this.services.two
        .getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn('pwr2'))
        .onGet(this.getOn('pwr2'))
    }

    if (this.accessory.context.device.gangs > 2) {
      this.services.three =
        this.accessory.getService('Switch Three') ??
        this.accessory.addService(
          this.platform.Service.Switch,
          'Switch Three',
          this.platform.api.hap.uuid.generate(
            `${this.accessory.context.device.uniqueId}-2`,
          ),
        )

      this.services.three.setCharacteristic(
        this.platform.Characteristic.Name,
        'Switch Three',
      )

      this.services.three
        .getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn('pwr3'))
        .onGet(this.getOn('pwr3'))
    }
  }

  setOn = (key: string) => async (value: CharacteristicValue) => {
    const { uniqueId } = this.accessory.context.device

    const hub = await this.getHubDevice()

    this.state = await hub.setState({
      did: uniqueId,
      ...this.state,
      [key]: value as boolean,
    })

    this.platform.log.debug('Set Characteristic On ->', value)
  }

  getOn = (key: string) => async (): Promise<CharacteristicValue> => {
    const { uniqueId } = this.accessory.context.device

    const hub = await this.getHubDevice()
    const state = await hub.getState(uniqueId)

    this.state[key] = state[key]

    this.platform.log.debug('Get Characteristic On ->', state[key])
    return state[key]
  }

  getHubDevice = async (): Promise<S3> => {
    const { host } = this.accessory.context.device
    const devices = await broadlink.discover()
    const hub = devices.find(d => d.host.address === host.address) as S3
    return (await hub.auth()) as S3
  }
}
