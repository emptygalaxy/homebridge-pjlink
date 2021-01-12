import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Service,
} from 'homebridge';
import {PJLink} from 'pjlink';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
// const PJLink = require('PJLink');

export class TelevisionSpeakerHandler {
    private readonly speakerService: Service;

    private muted = false;

    constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly accessory: PlatformAccessory,
        private readonly device: PJLink,
        private readonly tvService: Service,
        private readonly name: string,
    ) {
        this.speakerService = this.createSpeaker();
    }

    public getService(): Service {
        return this.speakerService;
    }

    private createSpeaker(): Service {
        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // service
        const service = this.accessory.getService(Service.TelevisionSpeaker) ||
            this.accessory.addService(Service.TelevisionSpeaker, this.name, 'tvSpeaker');

        service
            .getCharacteristic(Characteristic.Mute)
            .on(CharacteristicEventTypes.GET, this.getTelevisionMuted.bind(this))
            .on(CharacteristicEventTypes.SET, this.setTelevisionMuted.bind(this))
        ;

        this.tvService.addLinkedService(service);

        return service;
    }

    private getTelevisionMuted(callback: CharacteristicGetCallback): void {
        try {
            this.device.getMute((err: string|undefined, state: MuteState) => {
                if(err) {
                    this.log.error(err);
                    callback(new Error(err));
                } else {
                    this.log.info('muted', state);
                    callback(null, state.audio);
                }
            });
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }

    private setTelevisionMuted(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            const muted = (value === true);
            this.device.setMute(muted, (err: string|undefined, resp) => {
                this.log.info('setMute', muted, err, resp);
                if(err) {
                    callback(new Error(err));
                } else {
                    callback();
                }
            });
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }
    
    public update(): void {
        const Characteristic = this.api.hap.Characteristic;

        try {
            this.device.getMute((err: string|undefined, state: MuteState) => {
                if(err) {
                    this.log.error(err);
                } else {
                    this.log.info('muted', state);
                    if(state.audio !== this.muted) {
                        this.muted = state.audio;
                        this.speakerService.updateCharacteristic(Characteristic.Mute, this.muted);
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }
}