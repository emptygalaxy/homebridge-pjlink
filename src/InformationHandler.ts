import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {Television} from 'hap-nodejs/dist/lib/gen/HomeKit-TV';
import {Service} from 'hap-nodejs';
import {AccessoryInformation} from 'hap-nodejs/dist/lib/gen/HomeKit';
import {AccessoryConfig} from 'homebridge/lib/server';
// import {PJLink} from 'pjlink';
// const PJLink = require('pjlink');

export class InformationHandler {
    private readonly log: Logger;
    private readonly api: API;
    private readonly device: PJLink;

    // config
    private manufacturer: string;
    private model: string;
    private serialNumber: string;
    private version: string;

    private readonly informationService: AccessoryInformation;

    constructor(log: Logger, api: API, config: AccessoryConfig, device: PJLink) {
        this.log = log;
        this.api = api;
        this.device = device;

        // config
        this.manufacturer = config.manufacturer || '';
        this.model = config.model || '';
        this.serialNumber = config.serialNumber || '';
        this.version = config.version || '';

        this.informationService = this.createService();
    }

    private createService(): Television {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        const service = new Service.AccessoryInformation();
        service
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
            .setCharacteristic(Characteristic.FirmwareRevision, this.version)
        ;

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
            this.device.getManufacturer((error?: string, manufacturer?: string): void => {
                this.log.info('getManufacturer', error, manufacturer);
                if (!error && manufacturer) {
                    this.manufacturer = manufacturer;
                    this.informationService.updateCharacteristic(Characteristic.Manufacturer, this.manufacturer);
                }
            });

            this.device.getModel((error?: string, model?: string): void => {
                this.log.info('getModel', error, model);
                if (!error && model) {
                    this.model = model;
                    this.informationService.updateCharacteristic(Characteristic.Model, this.model);
                }
            });

            this.device.getInfo((error?: string, info?: string): void => {
                this.log.info('info', error, info);
                if (!error && info) {
                    this.version = info;
                    this.informationService.updateCharacteristic(Characteristic.FirmwareRevision, this.version);
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }
}