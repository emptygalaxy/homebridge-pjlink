import {API} from 'homebridge/lib/api';
import {PJLinkAccessory} from './PJLinkAccessory';

export = (api: API) => {
    api.registerAccessory('homebridge-pjlink', 'PJLink', PJLinkAccessory);
}