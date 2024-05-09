import {
  Service,
  PlatformAccessory,
  HAP,
  CharacteristicValue,
} from 'homebridge'
import { BroadlinkPlatform } from './platform'
import * as broadlink from 'node-broadlink'
import { Hysen } from 'node-broadlink'

export class ThermostatBeok {
  private service: Service
  private hap: HAP
  private device: Hysen | undefined

  constructor(
    private readonly platform: BroadlinkPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.device = undefined
    ;(async () => (this.device = await this.getDevice()))()

    for (const key in this.accessory.context.device) {
      this.platform.log.info(
        'Device key/value',
        key,
        this.accessory.context.device[key],
      )
    }
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Beok')
      .setCharacteristic(this.platform.Characteristic.Model, 'HY02/HY03')

    const serviceName = 'Thermostat Beok'
    this.service =
      this.accessory.getService(serviceName) ??
      this.accessory.addService(this.platform.Service.Thermostat, serviceName)

    this.hap = this.platform.api.hap
    this.service
      .getCharacteristic(
        this.platform.api.hap.Characteristic.CurrentHeatingCoolingState,
      )
      .onGet(this.handleCurrentHeatingCoolingStateGet)

    this.service
      .getCharacteristic(
        this.platform.api.hap.Characteristic.TargetHeatingCoolingState,
      )
      .onGet(this.handleTargetHeatingCoolingStateGet)
      .onSet(this.handleTargetHeatingCoolingStateSet)

    this.service
      .getCharacteristic(this.hap.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet)

    this.service
      .getCharacteristic(this.hap.Characteristic.TargetTemperature)
      .onGet(this.handleTargetTemperatureGet)
      .onSet(this.handleTargetTemperatureSet)

    this.service
      .getCharacteristic(this.hap.Characteristic.TemperatureDisplayUnits)
      .onGet(this.handleTemperatureDisplayUnitsGet)
      .onSet(this.handleTemperatureDisplayUnitsSet)
  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  handleCurrentHeatingCoolingStateGet =
    async (): Promise<CharacteristicValue> => {
      //this.platform.log.debug('Triggered GET CurrentHeatingCoolingState')

      // set this to a valid value for CurrentHeatingCoolingState
      //const currentValue = hap.Characteristic.CurrentHeatingCoolingState.OFF;

      // return (async () => {
      let currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.OFF
      //const device = await this.getDevice()
      if (!this.device) return 0
      const currentStatus = await this.device.getFullStatus()
      if (currentStatus.roomTemp >= currentStatus.thermostatTemp) {
        currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.COOL
      } else if (currentStatus.roomTemp < currentStatus.thermostatTemp) {
        currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.HEAT
      }

      return currentValue
      //})()
    }

  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateGet = async (
    value: any,
  ): Promise<CharacteristicValue> => {
    //this.platform.log.debug('Triggered GET TargetHeatingCoolingState')

    let currentValue = this.hap.Characteristic.TargetHeatingCoolingState.OFF
    if (!this.device) return 0
    const currentStatus = await this.device.getFullStatus()

    if (currentStatus.autoMode == 1) {
      currentValue = this.hap.Characteristic.TargetHeatingCoolingState.AUTO
    } else if (currentStatus.roomTemp > currentStatus.thermostatTemp) {
      currentValue = this.hap.Characteristic.TargetHeatingCoolingState.COOL
    } else if (currentStatus.roomTemp <= currentStatus.thermostatTemp) {
      currentValue = this.hap.Characteristic.TargetHeatingCoolingState.HEAT
    }

    return currentValue
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateSet = async (value: any) => {
    //this.platform.log.debug('Triggered SET TargetHeatingCoolingState:', value)
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet = async () => {
    //this.platform.log.debug('Triggered GET CurrentTemperature')

    if (!this.device) return 0
    const currentStatus = await this.device.getFullStatus()
    return currentStatus.roomTemp
  }

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet = async () => {
    //this.platform.log.debug('Triggered GET TargetTemperature')

    // set this to a valid value for TargetTemperature
    if (!this.device) return 0
    const currentStatus = await this.device.getFullStatus()
    return currentStatus.thermostatTemp
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  handleTargetTemperatureSet = async (value: any) => {
    //this.platform.log.debug('Triggered SET TargetTemperature:', value)
    //const device = await this.getDevice()
    if (!this.device) return
    await this.device.setTemp(value)
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet = async () => {
    //this.platform.log.debug('Triggered GET TemperatureDisplayUnits')

    // set this to a valid value for TemperatureDisplayUnits
    const currentValue = this.hap.Characteristic.TemperatureDisplayUnits.CELSIUS

    return currentValue
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet = async (value: any) => {
    //this.platform.log.debug('Triggered SET TemperatureDisplayUnits:', value)
  }

  getDevice = async (): Promise<Hysen> => {
    const { address } = this.accessory.context.device
    const devices = await broadlink.discover()
    const device = devices.find(d => d.host.address === address) as Hysen
    try {
      await device.auth()
    } catch (error) {
      this.platform.log.info(`Device host: ${address}, device: ${device}`)
    }
    return device as Hysen
  }
}
