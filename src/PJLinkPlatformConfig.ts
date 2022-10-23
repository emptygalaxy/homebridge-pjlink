import type {AccessoryConfig, PlatformConfig} from 'homebridge';

export interface PJLinkConfig extends AccessoryConfig {
  name: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  version?: string;
  id?: string;
  ip: string;
  port?: number;
  password?: string;
  pollingInterval?: number;
  enableSwitch?: boolean;
  enableSpeaker?: boolean;
}

export interface PJLinkPlatformConfig extends PlatformConfig {
  devices?: PJLinkConfig[];
}
