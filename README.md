## Introduction

This homebridge plugin allows you to control PJLink compatible projectors through HomeKit.

## Installation

1. Install homebridge using `npm install -g homebridge`
2. Install this plugin using `npm install -g homebridge-pjlink`
3. Update your homebridge config file to include the plugin and your projector(s)

## Configuration

### Example configuration

```json
{
  "platforms": [
    {
      "name": "PJLink",
      "platform": "PJLink",
      "devices": [
        {
          "name": "Projector",
          "ip": "192.168.2.26",
          "port": 4352,
          "password": "password",
          "pollingInterval": 10
        }
      ]
    }
  ]
}
```

### Configuration Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| id | string | No | | The unique identifier of the projector |
| name | string | Yes | | The name of the projector as it will appear in HomeKit |
| ip | string | Yes | | The IP address of the projector |
| port | number | No | 4352 | The port number of the projector |
| password | string | No | | The password for the projector |
| manufacturer | string | No | | The manufacturer of the projector |
| model | string | No | | The model of the projector |
| serialNumber | string | No | | The serial number of the projector |
| version | string | No | | The firmware version of the projector |
| pollingInterval | number | No | 10 | The interval at which the plugin polls the projector for updates |
| enableSwitch | boolean | No | false | Enable a switch in HomeKit to turn the projector on or off |
| enableSpeaker | boolean | No | false | Enable speaker controls in HomeKit for the projector |

## Supported functionality
- Power on/off
- Input selection
- Volume control (if enabled in config)

## Troubleshooting
- Make sure the IP address and port are correct
- Check the projector's manual to ensure it is compatible with PJLink
- Make sure the password is correct (if required)
- Try increasing the pollingInterval if updates are not being reflected in HomeKit
