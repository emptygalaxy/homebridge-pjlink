import {AccessoryConfig, PlatformConfig} from 'homebridge/lib/server';

export interface PJLinkConfig extends AccessoryConfig {
    name: string;
    id?: string;
    ip: string;
    port?: number;
    password?: string;
    pollingInterval?: number;
    enableSwitch?: boolean;
    enableSpeaker?: boolean;
}

export interface PJLinkPlatformConfig extends PlatformConfig {
    devices: PJLinkConfig[];
}

/*

      "accessory": "PJLink",
      "name": "Projector",
      "ip": "10.0.1.25",
      "port": 4352,
      "password": "panasonic",
      "pollingInterval": 10
 */