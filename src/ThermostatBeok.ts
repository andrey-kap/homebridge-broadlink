import {
  Service,
  PlatformAccessory,
  HAP,
  CharacteristicValue,
} from 'homebridge'
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
  handleTargetHeatingCoolingStateGet = async (
    value: any,
  ): Promise<CharacteristicValue> => {
    //this.platform.log.debug('Triggered GET TargetHeatingCoolingState')

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

    const currentStatus: any =
      await this.accessory.context.thermostat.getFullStatus()
    return currentStatus.thermostatTemp
  }

  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet = async () => {
    //this.platform.log.debug('Triggered GET TargetTemperature')

    // set this to a valid value for TargetTemperature
    const currentStatus: any =
      await this.accessory.context.thermostat.getFullStatus()
    return currentStatus.thermostatTemp
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  handleTargetTemperatureSet = async (value: any) => {
    //this.platform.log.debug('Triggered SET TargetTemperature:', value)
    await this.accessory.context.thermostat.setTemp(value)
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
}