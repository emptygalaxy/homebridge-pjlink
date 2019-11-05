const pjlink = require("pjlink");

let Service;
let Characteristic;

const PJLinkConst = {
    INPUT: {
        RGB: "rgb",
        VIDEO: "video",
        DIGITAL: "digital",
        STORAGE: "storage",
        NETWORK: "network"
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
module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-pjlink", "PJLink", PJLinkAccessory);
};



class PJLinkAccessory
{
    constructor(log, config, api) {
        this.log = log;
        this.name = config["name"] || "Projector";
        this.ip = config["ip"];
        this.port = config["port"] || 4352;
        this.password = config["password"] || "panasonic";
        this.pollingInterval = config["pollingInterval"] || 10;

        this.manufacturer = "";
        this.model = "";
        this.serial = "";

        this.enabledServices = [];

        // this.inputs = config["inputs"];

        this.pjlink = new pjlink(this.ip, this.port, this.password);

        if(this.pollingInterval > 0)
        {
            this.pollingIntervalId = setInterval(this.checkState.bind(this, this.updateState.bind(this)), this.pollingInterval * 1000);
        }

        this.prepareInformationService();
        this.prepareTelevisionService();
    }

    prepareInformationService()
    {
        let modelName = this.name;
        try
        {
            /*
            beamer.getName(function(err, name){
                console.log('name', err, name);
            });

            beamer.getManufacturer(function(err, manufacturer){
                console.log('manufacturer', err, manufacturer);
            });

            beamer.getModel(function(err, model){
                console.log('model', err, model);
            });

            beamer.getInfo(function(err, info){
                console.log('info', err, info);
            });
            */
        }
        catch (err)
        {
            this.log.debug('Cannot request model name');
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

    prepareTelevisionService()
    {
        this.tvService = new Service.Television(this.name, 'tvService');
        this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);
        this.tvService.setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(Characteristic.Active)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        /*
        //    this.tvService
        //        .setCharacteristic(Characteristic.ActiveIdentifier, 0); // do not preselect any input since there are no default inputs
        this.tvService.getCharacteristic(Characteristic.ActiveIdentifier)
            .on('set', (inputIdentifier, callback) => {
                this.log.debug('webOS - input source changed, new input source identifier: %d, source appId: %s', inputIdentifier, this.inputAppIds[inputIdentifier]);
                this.setAppSwitchState(true, callback, this.inputAppIds[inputIdentifier]);
            });
        this.tvService
            .getCharacteristic(Characteristic.RemoteKey)
            .on('set', this.remoteKeyPress.bind(this));
        this.tvService
            .getCharacteristic(Characteristic.PowerModeSelection)
            .on('set', (newValue, callback) => {
                this.log.debug('webOS - requested tv settings (PowerModeSelection): ' + newValue);
                this.setRemoteControlButtonState(true, callback, 'MENU');
            });


        // not supported in the ios beta yet?
        /*
        this.tvService
          .getCharacteristic(Characteristic.PictureMode)
          .on('set', function(newValue, callback) {
            console.log('set PictureMode => setNewValue: ' + newValue);
            callback(null);
          });
          */


        this.enabledServices.push(this.tvService);

        /*
        this.prepareTvSpeakerService();
        this.prepareInputSourcesService();

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
        callback(null, this.connected);
    }

    setPowerState(state, callback) {
        // if (state) {
        this.log.debug('webOS - power service - Trying to power on tv, sending magic packet');

        this.pjlink.powerOn(function(err)
        {
            callback();
        });
        /*
                } else {
                    if (this.connected) {
                        this.log.debug('webOS - power service - TV turned off');
                        this.lgtv.request('ssap://system/turnOff', (err, res) => {
                            this.lgtv.disconnect();
                            this.connected = false;
                            this.setAppSwitchManually(null, false, null);
                            this.setChannelButtonManually(null, false, null);
                            this.setMuteStateManually(false);
                            this.setSoundOutputManually(null, false, null);
                        })
                    }
                    callback();
                }
                */
    }

    getServices() {
        return this.enabledServices;
    }
}