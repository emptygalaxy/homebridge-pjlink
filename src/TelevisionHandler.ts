import {Logger} from 'homebridge/lib/logger';
import {
    API,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    CharacteristicEventTypes,
    Service,
} from 'homebridge';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
// import {PJLink} from 'PJLink';
const PJLink = require('pjlink');

export class TelevisionHandler {
    private readonly tvService: Service;
    private readonly switchService?: Service;

    private deviceActive = false;

    constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly accessory: PlatformAccessory,
        private readonly device: PJLink,
        private readonly name: string,
        private readonly enableSwitch=false,
    ) {
        this.tvService = this.createService();
        if(this.enableSwitch) {
            this.switchService = this.createSwitchService();
        }
    }

    private createService(): Service {
        // hap
        const Characteristic = this.api.hap.Characteristic;

        // service
        const tvService = (this.accessory.getService(this.api.hap.Service.Television) ||
            this.accessory.addService(this.api.hap.Service.Television, this.name));

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

    private createSwitchService(): Service {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // service
        const service = (this.accessory.getService(Service.Switch) ||
            this.accessory.addService(Service.Switch, this.name));
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