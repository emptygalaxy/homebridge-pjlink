import {APIEvent, DynamicPlatformPlugin, API} from 'homebridge/lib/api';
import {PlatformAccessory} from 'homebridge/lib/platformAccessory';
import {Logger} from 'homebridge/lib/logger';
import {PlatformConfig} from 'homebridge/lib/server';
import {PJLinkConfig, PJLinkPlatformConfig} from './PJLinkPlatformConfig';
import {PJLinkPlatformAccessory} from './PJLinkPlatformAccessory';
import {PLATFORM_NAME, PLUGIN_NAME} from './settings';

export class PJLinkPlatform implements DynamicPlatformPlugin {
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.log.debug('Load PJLink accessories');

            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory): void {
        this.accessories.push(accessory);
    }

    discoverDevices(): void {
        const c: PJLinkPlatformConfig = this.config as PJLinkPlatformConfig;

        const retiredAccessories = this.accessories.slice();

        const devices = c.devices;
        if(devices) {
            devices.forEach((device: PJLinkConfig) => {
                const name: string = device.name;
                const ip: string = device.ip;
                const port: number = device.port || 4352;

                // use identifier or generate based on ip+port
                const id: string = device.id || `pjlink://${ip}:${port}`;

                const uuid = this.api.hap.uuid.generate(id);

                const existingAccessory = this.accessories.find(accesory => accesory.UUID === uuid);
                if(existingAccessory) {
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName, uuid);

                    new PJLinkPlatformAccessory(this.log, this.api, device, this, existingAccessory);
                    this.api.updatePlatformAccessories([existingAccessory]);

                    // remove from retired devices
                    const retiredIndex = retiredAccessories.indexOf(existingAccessory);
                    if(retiredIndex > -1) {
                        retiredAccessories.splice(retiredIndex, 1);
                    }
                } else {
                    // console.log('new accessory', name, uuid);
                    const accessory = new this.api.platformAccessory(name, uuid);
                    accessory.context.device = device;

                    new PJLinkPlatformAccessory(this.log, this.api, device, this, accessory);
                    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
                }
            });
        }

        // clean up unused accessories
        this.log.info('removing retired accessories:', retiredAccessories);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, retiredAccessories);
    }

}