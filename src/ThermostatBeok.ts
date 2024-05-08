import { Service, PlatformAccessory, HAP } from 'homebridge'
import { BroadlinkPlatform } from './platform'

export class ThermostatBeok {
  private service: Service
  private hap: HAP

  constructor(
    private readonly platform: BroadlinkPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
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
      .onGet(this.handleCurrentHeatingCoolingStateGet.bind(this))

    this.service
      .getCharacteristic(
        this.platform.api.hap.Characteristic.TargetHeatingCoolingState,
      )
      .onGet(this.handleTargetHeatingCoolingStateGet.bind(this))
      .onSet(this.handleTargetHeatingCoolingStateSet.bind(this))

    this.service
      .getCharacteristic(this.hap.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this))

    this.service
      .getCharacteristic(this.hap.Characteristic.TargetTemperature)
      .onGet(this.handleTargetTemperatureGet.bind(this))
      .onSet(this.handleTargetTemperatureSet.bind(this))

    this.service
      .getCharacteristic(this.hap.Characteristic.TemperatureDisplayUnits)
      .onGet(this.handleTemperatureDisplayUnitsGet.bind(this))
      .onSet(this.handleTemperatureDisplayUnitsSet.bind(this))
  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  async handleCurrentHeatingCoolingStateGet() {
    this.platform.log.debug('Triggered GET CurrentHeatingCoolingState')

    // set this to a valid value for CurrentHeatingCoolingState
    //const currentValue = hap.Characteristic.CurrentHeatingCoolingState.OFF;

    // return (async () => {
    let currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.OFF
    const currentStatus =
      await this.accessory.context.thetmostat.getFullStatus()

    if (currentStatus.roomTemp > currentStatus.thermostatTemp) {
      currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.COOL
    } else if (currentStatus.roomTemp <= currentStatus.thermostatTemp) {
      currentValue = this.hap.Characteristic.CurrentHeatingCoolingState.HEAT
    }

    return currentValue
    //})()
  }

  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateGet() {
    this.platform.log.debug('Triggered GET TargetHeatingCoolingState')

    return (async () => {
      let currentValue = this.hap.Characteristic.TargetHeatingCoolingState.OFF
      const currentStatus =
        await this.accessory.context.thermostat.getFullStatus()

      if (currentStatus.autoMode == 1) {
        currentValue = this.hap.Characteristic.TargetHeatingCoolingState.AUTO
      } else if (currentStatus.roomTemp > currentStatus.thermostatTemp) {
        currentValue = this.hap.Characteristic.TargetHeatingCoolingState.COOL
      } else if (currentStatus.roomTemp <= currentStatus.thermostatTemp) {
        currentValue = this.hap.Characteristic.TargetHeatingCoolingState.HEAT
      }

      return currentValue
    })()
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateSet(value: any) {
    this.platform.log.debug('Triggered SET TargetHeatingCoolingState:', value)
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet() {
    this.platform.log.debug('Triggered GET CurrentTemperature')

    return (async () => {
      const currentStatus: any =
        await this.accessory.context.thermostat.getFullStatus()
      return currentStatus.thermostatTemp
    })()
  }

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet() {
    this.platform.log.debug('Triggered GET TargetTemperature')

    // set this to a valid value for TargetTemperature

    return (async () => {
      const currentStatus: any =
        await this.accessory.context.thermostat.getFullStatus()
      return currentStatus.thermostatTemp
    })()
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  handleTargetTemperatureSet(value: any) {
    this.platform.log.debug('Triggered SET TargetTemperature:', value)
    ;(async () => {
      await this.accessory.context.thermostat.setTemp(value)
    })()
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet() {
    this.platform.log.debug('Triggered GET TemperatureDisplayUnits')

    // set this to a valid value for TemperatureDisplayUnits
    const currentValue = this.hap.Characteristic.TemperatureDisplayUnits.CELSIUS

    return currentValue
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet(value: any) {
    this.platform.log.debug('Triggered SET TemperatureDisplayUnits:', value)
  }
}
