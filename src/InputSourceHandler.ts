import {Logger} from 'homebridge/lib/logger';
import {API} from 'homebridge/lib/api';
import {
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    Service,
} from 'homebridge';
import {AccessoryConfig} from 'homebridge/lib/server';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
// import {PJLink} from 'PJLink';
const PJLink = require('pjlink');

export class InputSourceHandler {
    private readonly mockInputs: boolean = true;
    private readonly defaultInput: string = '31';
    private inputs: Input[] = [];

    private readonly inputServices: Service[] = [];
    private activeIdentifier?: string;

    constructor(
        private readonly log: Logger,
        private readonly api: API,
        private readonly accessory: PlatformAccessory,
        private readonly device: PJLink,
        private readonly config: AccessoryConfig,
        private readonly tvService: Service) {
        this.log = log;
        this.api = api;
        this.device = device;
        this.tvService = tvService;

        this.getInputSources(config.inputs);
        this.prepareTelevision();
    }

    public getServices(): Service[] {
        return this.inputServices;
    }

    private prepareTelevision() {
        // hap
        const Characteristic = this.api.hap.Characteristic;

        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on(CharacteristicEventTypes.GET, this.getActiveIdentifier.bind(this))
            .on(CharacteristicEventTypes.SET, this.setActiveIdentifier.bind(this))
        ;
    }

    private getInputSources(configured) {
        if(configured) {
            for(let i=0; i<configured.length; i++) {
                configured[i].code = configured[i].source.toString() + configured[i].channel.toString();
            }
            this.setupInputs(configured);
        } else if(this.mockInputs) {
            this.setupInputs([
                { source: PJLink.INPUT.RGB, channel: 1, code: '11', name: 'RGB 1' },
                { source: PJLink.INPUT.RGB, channel: 2, code: '12', name: 'RGB 2' },
                { source: PJLink.INPUT.VIDEO, channel: 1, code: '21', name: 'VIDEO 1' },
                { source: PJLink.INPUT.VIDEO, channel: 2, code: '22', name: 'VIDEO 2' },
                { source: PJLink.INPUT.DIGITAL, channel: 1, code: '31', name: 'DIGITAL 1' },
            ]);
        } else {
            this.device.getInputs((error?: string, inputs?: Input[]): void => {
                if(inputs) {
                    this.setupInputs(inputs);
                }
            });
        }
    }

    private setupInputs(inputs: Input[]) {
        this.inputs = inputs;

        // hap
        const Service = this.api.hap.Service;
        const Characteristic = this.api.hap.Characteristic;

        // setup
        inputs.forEach((input: Input) => {
            const identifier = input.code;
            const inputName = input.name;
            this.log.info(identifier, inputName);

            const inputSource:Service = this.accessory.getService(identifier) ||
                this.accessory.addService(Service.InputSource, identifier, inputName);

            const inputType = this.mapInputType(input.source);

            inputSource
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                .setCharacteristic(Characteristic.InputSourceType, inputType)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN)
                .setCharacteristic(Characteristic.Identifier, identifier)
            ;

            inputSource.getCharacteristic(this.api.hap.Characteristic.ConfiguredName)
                .on(this.api.hap.CharacteristicEventTypes.SET, this.setConfiguredInputSourceName.bind(this, identifier));


            if(input.code === this.defaultInput) {
                this.activeIdentifier = identifier;
                this.tvService.updateCharacteristic(Characteristic.ActiveIdentifier, this.activeIdentifier);
            }

            this.tvService.addLinkedService(inputSource);
            this.inputServices.push(inputSource);
        });
    }

    private getActiveIdentifier(callback: CharacteristicGetCallback): void {
        this.log.info('get active identifier', this.activeIdentifier);
        callback(null, this.activeIdentifier);
    }

    private setActiveIdentifier(value: CharacteristicValue, callback: CharacteristicSetCallback): void {
        try {
            this.log.info('set active identifier', value);

            let activeInput: Input|null = null;
            for(let i=0; i<this.inputs.length; i++) {
                const input = this.inputs[i];
                if(input.code === value) {
                    activeInput = input;
                }
            }

            if(activeInput !== null) {
                this.device.setInput(activeInput, (error?: string) => {
                    if(error) {
                        callback(new Error(error));
                    } else {
                        callback();
                    }
                });
            }
        } catch (e) {
            this.log.error(e);
            callback(e);
        }
    }

    public update(): void {
        try {
            this.device.getInput((error?: string, input?: Input) => {
                if (error) {
                    this.log.error(error);
                } else {
                    if (input && input.code !== this.activeIdentifier) {
                        this.activeIdentifier = input.code;

                        const Characteristic = this.api.hap.Characteristic;
                        this.tvService.updateCharacteristic(Characteristic.ActiveIdentifier, this.activeIdentifier);
                    }
                }
            });
        } catch (e) {
            this.log.error(e);
        }
    }

    private mapInputType(type): CharacteristicValue {
        // hap
        const Characteristic = this.api.hap.Characteristic;

        switch(type) {
            case PJLink.INPUT.RGB:
                return Characteristic.InputSourceType.COMPONENT_VIDEO;

            case PJLink.INPUT.DIGITAL:
                return Characteristic.InputSourceType.HDMI;

            case PJLink.INPUT.NETWORK:
                return Characteristic.InputSourceType.AIRPLAY;

            case PJLink.INPUT.VIDEO:
                return Characteristic.InputSourceType.S_VIDEO;

            case PJLink.INPUT.STORAGE:
                return Characteristic.InputSourceType.USB;

            default:
                return Characteristic.InputSourceType.OTHER;
        }
    }

    private setConfiguredInputSourceName(inputIdentifier: string, value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.log.info('Set input value', inputIdentifier, value);

        // this.accessory.context.inputLabels[inputIdentifier] = value;

        callback();
    }
}