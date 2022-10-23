import type {Logger, API, Service, PlatformAccessory} from 'homebridge';
import {PJLink} from 'pjlink';
import {PJLinkConfig} from './PJLinkPlatformConfig';
// const PJLink = require('PJLink');

export class InformationHandler {
  // config
  private manufacturer: string;
  private model: string;
  private serialNumber: string;
  private version: string;

  private readonly informationService: Service;

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly accessory: PlatformAccessory,
    private readonly device: PJLink,
    config: PJLinkConfig
  ) {
    // config
    this.manufacturer = config.manufacturer || 'Manufacturer';
    this.model = config.model || 'Model';
    this.serialNumber = config.serialNumber || 'Serial';
    this.version = config.version || 'Version';

    this.informationService = this.createService();
  }

  private createService(): Service {
    // hap
    const Service = this.api.hap.Service;
    const Characteristic = this.api.hap.Characteristic;

    const service =
      this.accessory.getService(Service.AccessoryInformation) ||
      this.accessory.addService(Service.AccessoryInformation);

    service
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.version);

    this.update();

    return service;
  }

  public getService(): Service {
    return this.informationService;
  }

  public update(): void {
    // hap
    const Characteristic = this.api.hap.Characteristic;

    try {
      this.device.getManufacturer(
        (error?: string, manufacturer?: string): void => {
          this.log.info('getManufacturer', error, manufacturer);
          if (!error && manufacturer) {
            this.manufacturer = manufacturer;
            this.informationService.updateCharacteristic(
              Characteristic.Manufacturer,
              this.manufacturer
            );
          }
        }
      );

      this.device.getModel((error?: string, model?: string): void => {
        this.log.info('getModel', error, model);
        if (!error && model) {
          this.model = model;
          this.informationService.updateCharacteristic(
            Characteristic.Model,
            this.model
          );
        }
      });

      this.device.getInfo((error?: string, info?: string): void => {
        this.log.info('info', error, info);
        if (!error && info) {
          this.version = info;
          this.informationService.updateCharacteristic(
            Characteristic.FirmwareRevision,
            this.version
          );
        }
      });
    } catch (e) {
      if (e instanceof Error) {
        this.log.error(e.message);
      }
    }
  }
}
