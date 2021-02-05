import {
    API,
    Service,
} from 'homebridge';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {Logger} from 'homebridge/lib/logger';
import {PJLinkConfig} from './PJLinkPlatformConfig';
import {PJLinkPlatform} from './PJLinkPlatform';
import Timeout = NodeJS.Timeout;
import {TelevisionHandler} from './TelevisionHandler';
import {InformationHandler} from './InformationHandler';
import {InputSourceHandler} from './InputSourceHandler';
import {TelevisionSpeakerHandler} from './TelevisionSpeakerHandler';
// import {PJLink} from 'PJLink';
const PJLink = require('PJLink');

export class PJLinkPlatformAccessory {
    private readonly name: string;

    private readonly manufacturer: string;
    private readonly ip: string;
    private readonly port: number;
    private readonly password: string;
    private readonly interval?: number;
    private readonly enableSwitch: boolean;
    private readonly enableSpeaker: boolean;

    private readonly device: PJLink;
    private readonly intervalId?: Timeout;

    private readonly informationHandler: InformationHandler;
    private readonly tvHandler: TelevisionHandler;
    private readonly inputsHandler: InputSourceHandler;
    private readonly speakerHandler?: TelevisionSpeakerHandler;

    public constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly config: PJLinkConfig,
        private readonly platform: PJLinkPlatform,
        private readonly accessory: PlatformAccessory,
    ) {

        // handle config
        const c = config;

        this.name = c.name || 'PJLink';
        this.manufacturer = c.manufacturer || 'Manufacturer';
        this.ip = c.ip;
        this.password = c.password || '';
        this.port = c.port || 4352;
        this.enableSwitch = c.enableSwitch || false;
        this.enableSpeaker = c.enableSpeaker || false;


        this.log.info('connect', `${this.ip}:${this.port}`);

        // pj-link device
        this.device = new PJLink(this.ip, this.port, this.password);

        // set category
        this.accessory.category = this.api.hap.Categories.TELEVISION;

        // handlers
        this.tvHandler = new TelevisionHandler(this.log, this.api, this.accessory, this.device, this.name, this.enableSwitch);
        this.informationHandler = new InformationHandler(this.log, this.api, this.accessory, this.device, config);
        this.inputsHandler = new InputSourceHandler(this.log, this.api, this.accessory, this.device, config, this.tvHandler.getService());
        if(this.enableSpeaker) {
            this.speakerHandler = new TelevisionSpeakerHandler(this.log, this.api, this.accessory, this.device,
                this.tvHandler.getService(), this.name);
        }

        if(this.interval) {
            this.intervalId = setInterval(this.update.bind(this), this.interval * 1000);
        }
        this.update();


        // console.dir(this.accessory.context);
        log.info('finished initializing!');
    }

    /**
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     * @returns Service[]
     */
    getServices(): Service[] {
        // return this.availableServices;
        let services: Service[] = [
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

    public update(): void {
        // this.informationHandler.update();
        this.tvHandler.update();
        this.inputsHandler.update();
        if(this.speakerHandler) {
            this.speakerHandler.update();
        }
    }
}