import type {
  Logger,
  PlatformAccessory,
  DynamicPlatformPlugin,
  API,
} from 'homebridge';
import {APIEvent} from 'homebridge';
import {PJLinkConfig, PJLinkPlatformConfig} from './PJLinkPlatformConfig';
import {PJLinkPlatformAccessory} from './PJLinkPlatformAccessory';
import {PLATFORM_NAME, PLUGIN_NAME} from './settings';

export class PJLinkPlatform implements DynamicPlatformPlugin {
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PJLinkPlatformConfig,
    public readonly api: API
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
    const retiredAccessories = this.accessories.slice();

    const devices = this.config.devices;
    if (devices) {
      devices.forEach((device: PJLinkConfig) => {
        const name: string = device.name;
        const ip: string = device.ip;
        const port: number = device.port || 4352;

        // use identifier or generate based on ip+port
        const id: string = device.id || `pjlink://${ip}:${port}`;

        const uuid = this.api.hap.uuid.generate(id);

        const existingAccessory = this.accessories.find(
          accesory => accesory.UUID === uuid
        );
        if (existingAccessory) {
          this.log.info(
            'Restoring existing accessory from cache:',
            existingAccessory.displayName,
            uuid
          );

          new PJLinkPlatformAccessory(
            this.log,
            this.api,
            device,
            this,
            existingAccessory
          );
          this.api.updatePlatformAccessories([existingAccessory]);

          // remove from retired devices
          const retiredIndex = retiredAccessories.indexOf(existingAccessory);
          if (retiredIndex > -1) {
            retiredAccessories.splice(retiredIndex, 1);
          }
        } else {
          // console.log('new accessory', name, uuid);
          if (!name || name === '') {
            this.log.error(
              'PJLink device must be created with a non-empty name'
            );
          } else {
            const accessory = new this.api.platformAccessory(name, uuid);
            accessory.context.device = device;

            new PJLinkPlatformAccessory(
              this.log,
              this.api,
              device,
              this,
              accessory
            );
            this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
          }
        }
      });
    }

    // clean up unused accessories
    this.log.info('removing retired accessories:', retiredAccessories);
    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      retiredAccessories
    );
  }
}
