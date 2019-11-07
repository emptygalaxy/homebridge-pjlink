'use strict';

const pjlink = require('pjlink');

/**
 * @type HAPNodeJS.Service
 */
let Service;

/**
 * @type HAPNodeJS.Characteristic
 */
let Characteristic;

/**
 *
 * @type {{INPUT: {STORAGE: string, NETWORK: string, VIDEO: string, RGB: string, DIGITAL: string}, POWER: {COOLING_DOWN: number, WARMING_UP: number, OFF: number, ON: number}}}
 */
const PJLinkConst = {
    INPUT: {
        RGB: 'rgb',
        VIDEO: 'video',
        DIGITAL: 'digital',
        STORAGE: 'storage',
        NETWORK: 'network'
    },
    POWER: {
        OFF: 0,
        ON: 1,
        COOLING_DOWN: 2,
        WARMING_UP: 3
    }
};

/**
 *
 * @param homebridge
 */
module.exports = (homebridge) => {
    /* this is the starting point for the plugin where we register the accessory */
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-pjlink', 'PJLink', PJLinkAccessory);
};


/**
 *
 */
class PJLinkAccessory
{
    constructor(log, config) {
        this.log = log;
        this.name = config['name'] || 'Projector';
        this.ip = config['ip'];
        this.port = config['port'] || 4352;
        this.password = config['password'] || 'panasonic';
        this.pollingInterval = config['pollingInterval'] || 10;

        this.manufacturer = '';
        this.model = '';
        this.serial = '';

        this.enabledServices = [];

        // this.inputs = config['inputs'];


        let pjconfig = {
            "host": this.ip,
            "port": this.port,
            "password": this.password,
            "timeout": 1000};
        this.log.info(pjconfig);
        //this.beamer = new pjlink(this.ip, this.port, this.password);
        this.beamer = new pjlink(pjconfig);

        this.log.info("connecting to pjlink at %s", this.ip);

        if(this.pollingInterval > 0)
        {
            this.pollingIntervalId = setInterval(this.checkState.bind(this, this.updateStatus.bind(this)), this.pollingInterval * 1000);
        }

        this.prepareInformationService();
        this.prepareTelevisionService();
    }

    prepareInformationService()
    {
        this.log.info("testing");

        let modelName = this.name;
        try
        {
            this.beamer.getName(function(err, name){
                this.log.info("response from get name %s %s", err, name);
                if(err)
                    return this.log.error('Cannot get name (%s)', err);
                this.name = name;
                this.informationService.setCharacteristic(Characteristic.Model, this.name);
            }.bind(this));

            this.beamer.getManufacturer(function(err, manufacturer){
                if(err)
                    return this.log.error('Cannot get manufacturer (%s)', err);
                this.manufacturer = manufacturer;
                this.informationService.setCharacteristic(Characteristic.Manufacturer, this.manufacturer);
            }.bind(this));

            this.beamer.getModel(function(err, model){
                if(err)
                    return this.log.error('Cannot get model (%s)', err);
                this.model = model;
                this.informationService.setCharacteristic(Characteristic.Model, this.model);
            }.bind(this));

            this.beamer.getInfo(function(err, info){
                this.log.info('info', err, info);
            }.bind(this));

        }
        catch (err)
        {
            this.log.info('Cannot request model name');
        }

        // there is currently no way to update the AccessoryInformation service after it was added to the service list
        // when this is fixed in homebridge, update the informationService with the TV info?
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.name)
            .setCharacteristic(Characteristic.SerialNumber, this.serial)
        ;
        // .setCharacteristic(Characteristic.FirmwareRevision, '1.6.2')

        this.enabledServices.push(this.informationService);
    }

    checkState(callback)
    {
        callback();
    }
    updateStatus(error, status)
    {

    }

    prepareTelevisionService()
    {
        this.tvService = new Service.Television(this.name, 'tvService');
        this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
        this.tvService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(Characteristic.Active)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        //    this.tvService
        //        .setCharacteristic(Characteristic.ActiveIdentifier, 0); // do not preselect any input since there are no default inputs
        /*
        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on('set', (inputIdentifier, callback) => {
                this.log.debug('webOS - input source changed, new input source identifier: %d, source appId: %s', inputIdentifier, this.inputAppIds[inputIdentifier]);
                this.setAppSwitchState(true, callback, this.inputAppIds[inputIdentifier]);
            });
*/


        this.enabledServices.push(this.tvService);

        // this.prepareTvSpeakerService();
        // this.prepareInputSourcesService();

        /*
        // additional services
        this.prepareVolumeService();
        this.prepareChannelService();
        this.prepareMediaControlService();
        this.prepareChannelButtonService();
        this.prepareNotificationButtonService();
        this.prepareRemoteControlButtonService();
        this.prepareSoundOutputButtonService();
        this.prepareRemoteSequenceButtonsService();

        // add additional input buttons
        if (this.showInputButtons === true) {
            this.prepareInputButtonService();
        }
        */
    }

    getPowerState(callback) {
        /**
         Four possible power states:
         * 0	/	pjlink.POWER.OFF
         * 1 /	pjlink.POWER.ON
         * 2 /	pjlink.POWER.COOLING_DOWN
         * 3 /	pjlink.POWER.WARMING_UP
         **/
        try {
            this.beamer.getPowerState(function (err, state) {
                if (err) {
                    this.log.error(err);
                    return callback(new Error(err));
                }
                callback(null, state === PJLinkConst.POWER.ON);
            }.bind(this));
        }
        catch(err)
        {
            this.log.error(err);
        }
    }

    setPowerState(state, callback) {
        this.log.info('power service - Trying to power ' + (state ? 'on':'off'));

        try {
            if (state)
                this.beamer.powerOn(function (err) {
                    if (err) {
                        this.log.error('error turning on', err);
                        return callback(new Error(err));
                    }
                    callback();
                }.bind(this));
            else
                this.beamer.powerOff(function (err) {
                    if (err) {
                        this.log.error('error turning off', err);
                        return callback(new Error(err));
                    }
                    callback();
                }.bind(this));
        }
        catch(err)
        {
            this.log.error(err);
        }
    }





    prepareTvSpeakerService()
    {
        this.tvSpeakerService = new Service.TelevisionSpeaker(this.name + ' Volume', 'tvSpeakerService');

        this.log.info("Characteristic.VolumeControlType %s", Characteristic.VolumeControlType);

        this.tvSpeakerService
            .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
            .setCharacteristic(Characteristic.VolumeControlType, Characteristic.VolumeControlType.ABSOLUTE);
        /*
        this.tvSpeakerService
            .getCharacteristic(Characteristic.VolumeSelector)
            .on('set', (state, callback) => {
                this.log.info('webOS - volume change over the remote control (VolumeSelector), pressed: %s', state === 1 ? 'Down' : 'Up');
                this.setVolumeSwitch(state, callback, !state);
            });
            */
        this.tvSpeakerService
            .getCharacteristic(Characteristic.Mute)
            .on('get', this.getMuteState.bind(this))
            .on('set', this.setMuteState.bind(this));
        /*
        this.tvSpeakerService
            .addCharacteristic(Characteristic.Volume)
            .on('get', this.getVolume.bind(this))
            .on('set', this.setVolume.bind(this));
        */
        this.tvService.addLinkedService(this.tvSpeakerService);
        this.enabledServices.push(this.tvSpeakerService);
    }

    getMuteState(callback) {

        this.log.info('Getting mute state');

        this.beamer.getMute(function(err, state){
            this.log.info('Received mute state %s or error %s', state, err);

            if(err)
                callback(new Error(err), false);
            else
                callback(null, state);
        }.bind(this));
    }

    setMuteState(state, callback) {
        this.log.info('volume service - TV %s', !state ? 'Muted' : 'Unmuted');

        this.beamer.setMute(state, true, function(err){
            if(err) this.log.error('error setting mute');
            callback();
        }.bind(this));

    }

    prepareInputSourcesService()
    {
        let inputs = [PJLinkConst.INPUT.DIGITAL, PJLinkConst.INPUT.VIDEO];
        for(let index in inputs)
        {
            let inputName = inputs[index];
            let tmpInput = new Service.InputSource(inputName, 'inputSource' + index);
            tmpInput
                .setCharacteristic(Characteristic.Identifier, index)
                .setCharacteristic(Characteristic.ConfiguredName, inputName)
                .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(Characteristic.InputSourceType, Characteristic.InputSourceType.HDMI)
                .setCharacteristic(Characteristic.CurrentVisibilityState, Characteristic.CurrentVisibilityState.SHOWN);

            tmpInput
                .getCharacteristic(Characteristic.ConfiguredName)
                .on('set', (name, callback) => {
                    this.log.info('input name changed! New name: %s', name);
                    /*
                    savedNames[appId] = name;
                    fs.writeFile(this.inputNamesFile, JSON.stringify(savedNames), (err) => {
                        if (err) {
                            this.log.debug('webOS - error occured could not write input name %s', err);
                        } else {
                            this.log.debug('webOS - input name successfully saved! New name: %s AppId: %s', name, appId);
                        }
                    });
                    */
                    callback()
                });

            this.tvService.addLinkedService(tmpInput);
            this.enabledServices.push(tmpInput);
        }
    }

    /*
    getVolume(callback) {
        // if (this.connected) {
        //     callback(null, this.tvVolume);
        // } else {
            callback(null, 0);
        // }
    }

    setVolume(level, callback) {
        // if (this.connected) {
            this.log.info('webOS - volume service - setting volume to %s, limit: %s', level, this.volumeLimit);
            // if (level > this.volumeLimit) {
            //     level = this.volumeLimit;
            // }
            // this.lgtv.request('ssap://audio/setVolume', {
            //     volume: level
            // });
            callback();
        // } else {
        //     callback(new Error('webOS - TV is not connected, cannot set volume'));
        // }
    }

    getVolumeSwitch(callback)
    {
        callback(null, false);
    }


    setVolumeSwitch(state, callback, isUp)
    {
        this.log.info("Set volume %s %s", state, isUp);
        callback();
    }
    */

    getServices() {
        return this.enabledServices;
    }
}