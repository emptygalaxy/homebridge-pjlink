import {API} from 'homebridge/lib/api';
import {PJLinkPlatform} from './PJLinkPlatform';
import {PLATFORM_NAME, PLUGIN_NAME} from './settings';

export = (api: API) => {
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, PJLinkPlatform);
}