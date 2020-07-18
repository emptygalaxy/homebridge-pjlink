import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Service,
} from 'hap-nodejs';
import {Television, TelevisionSpeaker} from 'hap-nodejs/dist/lib/gen/HomeKit-TV';
import {PJLink} from 'pjlink';
// const PJLink = require('pjlink');

export class TelevisionSpeakerHandler {
    private readonly log: Logger;
    private readonly api: API;
    private readonly device: PJLink;
    private readonly tvService: Television;
    private readonly name: string;

    private readonly speakerService: TelevisionSpeaker;

    private muted = false;

    constructor(log: Logger, api: API, device: PJLink, tvService: Television, name: string) {
        this.log = log;
        this.api = api;
        this.device = device;
        this.tvService = tvService;
        this.name = name;

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
        const service = new Service.TelevisionSpeaker(this.name, 'tvSpeaker');
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
        try {
            this.device.getMute((err: string|undefined, state: MuteState) => {
                if(err) {
                    this.log.error(err);
                } else {
                    this.log.info('muted', state);
                    if(state.audio !== this.muted) {
                        this.muted = state.audio;
                        this.speakerService.updateCharacteristic(this.api.hap.Characteristic.Mute, this.muted);
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }
}