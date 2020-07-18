import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Service,
} from 'hap-nodejs';
import {Television} from 'hap-nodejs/dist/lib/gen/HomeKit-TV';
import {Switch} from 'hap-nodejs/dist/lib/gen/HomeKit';
// import {PJLink} from 'pjlink';
const PJLink = require('pjlink');

export class TelevisionHandler {
    private readonly log: Logger;
    private readonly api: API;
    private readonly device: PJLink;
    private readonly name: string;
    private readonly enableSwitch: boolean;

    private readonly tvService: Television;
    private readonly switchService?: Switch;

    private deviceActive = false;

    constructor(log: Logger, api: API, device: PJLink, name: string, enableSwitch=false) {
        this.log = log;
        this.api = api;
        this.device = device;
        this.name = name;
        this.enableSwitch = enableSwitch;

        this.tvService = this.createService();
        if(this.enableSwitch) {
            this.switchService = this.createSwitchService();
        }
    }

    private createService(): Television {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // service
        const tvService = new Service.Television(this.name, 'tvService');
        tvService
            .setCharacteristic(Characteristic.ConfiguredName, this.name)
            .setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE)
        ;
        tvService.getCharacteristic(Characteristic.Active)
            .on(CharacteristicEventTypes.GET, this.getTelevisionActive.bind(this))
            .on(CharacteristicEventTypes.SET, this.setTelevisionActive.bind(this))
        ;
        tvService.getCharacteristic(this.api.hap.Characteristic.RemoteKey)
            .on(CharacteristicEventTypes.SET, this.setRemoteKey.bind(this));

        return tvService;
    }

    private createSwitchService(): Switch {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // service
        const service = new Service.Switch(this.name);
        service.getCharacteristic(Characteristic.On)
            .on(CharacteristicEventTypes.GET, this.getTelevisionActive.bind(this))
            .on(CharacteristicEventTypes.SET, this.setTelevisionActive.bind(this))
        ;

        return service;
    }

    public getService(): Service {
        return this.tvService;
    }

    public getSwitchService(): Service|undefined {
        return this.switchService;
    }

    /**
     * Get television active
     * @param callback
     */
    private getTelevisionActive(callback: CharacteristicGetCallback): void {
        try {
            this.device.getPowerState((error: string | undefined, state) => {
                if (error) {
                    this.log.error(error);
                    callback(new Error(error));
                } else {
                    this.deviceActive = (state === PJLink.POWER.ON);
                    this.log.info('television active', this.deviceActive);
                    callback(null, this.deviceActive);
                }
            });
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }

    /**
     * Set television active
     * @param {boolean} value
     * @param callback
     */
    private setTelevisionActive(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        // hap
        const Characteristic = this.api.hap.Characteristic;

        try {
            const powerState = (value === 1 || value === true) ? PJLink.POWER.ON : PJLink.POWER.OFF;
            this.device.setPowerState(powerState, (error?: string) => {
                this.log.info('setPowerState', value, powerState, error);
                if (error) {
                    callback(new Error(error));
                } else {

                    this.deviceActive = (powerState === PJLink.POWER.ON);
                    callback();
                    this.tvService.updateCharacteristic(Characteristic.Active, this.deviceActive);

                    if(this.switchService) {
                        this.switchService.updateCharacteristic(Characteristic.On, this.deviceActive);
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }

    private setRemoteKey(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        this.log.info('setRemoteKey', value);
        callback();
    }

    public update(): void {
        try {
            this.device.getPowerState((error: string|undefined, state) => {
                if(error) {
                    this.log.error(error);
                } else {
                    const active = (state === PJLink.POWER.ON);
                    if(active !== this.deviceActive) {
                        this.deviceActive = active;

                        // hap
                        const Characteristic = this.api.hap.Characteristic;

                        this.tvService.updateCharacteristic(Characteristic.Active, this.deviceActive);

                        if(this.switchService) {
                            this.switchService.updateCharacteristic(Characteristic.On, this.deviceActive);
                        }
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }
}