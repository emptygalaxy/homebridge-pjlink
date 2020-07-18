import {AccessoryPlugin, API} from 'homebridge/lib/api';
import {Logger} from 'homebridge/lib/logger';
import {AccessoryConfig} from 'homebridge/lib/server';
import {
    Controller,
    Service,
} from 'hap-nodejs';
import Timeout = NodeJS.Timeout;
import {TelevisionHandler} from './TelevisionHandler';
import {InformationHandler} from './InformationHandler';
import {InputSourceHandler} from './InputSourceHandler';
import {TelevisionSpeakerHandler} from './TelevisionSpeakerHandler';
// import {PJLink} from 'pjlink';
const PJLink = require('pjlink');

export class PJLinkAccessory implements AccessoryPlugin {
    private readonly log: Logger;
    private readonly api: API;

    private readonly name: string;
    private readonly host: string;
    private readonly port: number;
    private readonly password: string;
    private readonly interval: number;
    private readonly enableSwitch: boolean;
    private readonly enableSpeaker: boolean;

    private readonly device: PJLink;
    private readonly intervalId?: Timeout;

    private readonly informationHandler: InformationHandler;
    private readonly tvHandler: TelevisionHandler;
    private readonly inputsHandler: InputSourceHandler;
    private readonly speakerHandler?: TelevisionSpeakerHandler;

    constructor(log: Logger, config: AccessoryConfig, api: API) {
        this.log = log;
        this.api = api;

        // read config
        this.name = config.name;

        this.host = config.ip;
        this.port = config.port || 4352;
        this.password = config.password || 'panasonic';
        this.interval = config.pollingInterval || 60;
        this.enableSwitch = config.enableSwitch || false;
        this.enableSpeaker = config.enableSpeaker || false;

        // pj-link device
        this.device = new PJLink(this.host, this.port, this.password);

        // handlers
        this.tvHandler = new TelevisionHandler(this.log, this.api, this.device, this.name, this.enableSwitch);
        this.informationHandler = new InformationHandler(this.log, this.api, config, this.device);
        this.inputsHandler = new InputSourceHandler(this.log, this.api, config, this.device, this.tvHandler.getService());
        if(this.enableSpeaker) {
            this.speakerHandler = new TelevisionSpeakerHandler(this.log, this.api, this.device, this.tvHandler.getService(), this.name);
        }

        if(this.interval) {
            this.intervalId = setInterval(this.update.bind(this), this.interval * 1000);
        }
        this.update();
    }

    getControllers(): Controller[] {
        return [];
    }

    getServices(): Service[] {
        let services = [
            this.informationHandler.getService(),
            this.tvHandler.getService(),
        ];

        if(this.speakerHandler) {
            services.push(this.speakerHandler.getService());
        }

        const switchService = this.tvHandler.getSwitchService();
        if(switchService) {
            services.push(switchService);
        }

        services = services.concat(this.inputsHandler.getServices());

        return services;
    }

    identify(): void {
        this.log.info('Identify!');
    }

    public update(): void {
        // this.informationHandler.update();
        this.tvHandler.update();
        this.inputsHandler.update();
        if(this.speakerHandler) {
            this.speakerHandler.update();
        }
    }
}