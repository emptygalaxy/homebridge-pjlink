declare class PJLink {
  constructor(host: string | PJLinkSettings, port?: number, password?: string);

  disconnect(): void;

  // power
  static POWER: Power;
  powerOn(cb: (error?: string) => void): void;
  powerOff(cb: (error?: string) => void): void;
  setPowerState(state: PowerState, cb: (error?: string) => void): void;
  getPowerState(cb: (error?: string, state?: PowerState) => void): void;

  // input
  static INPUT: InputValues;
  setInput(input: Input, cb: (error?: string) => void): void;
  getInput(cb: (error?: string, input?: Input) => void): void;

  // inputs
  getInputs(cb: (error?: string, inputs?: Input[]) => void): void;

  // mute
  setMute(val, cb: (error?: string) => void): void;
  getMute(cb: (error?: string, state?: MuteState) => void): void;

  // error
  getErrors(cb: (error?: string, errors?: PJLinkError) => void): void;

  // lamp
  getLamps(cb: (error?: string, lamps?: Lamp[]) => void): void;

  // info
  getName(cb: (error?: string, name?: string) => void): void;
  getManufacturer(cb: (error?: string, manufacturer?: string) => void): void;
  getModel(cb: (error?: string, model?: string) => void): void;
  getInfo(cb: (error?: string, info?: string) => void): void;
  getClass(cb: (error?: string, classType?: number) => void): void;
}

interface PJLinkSettings {
  host?: string;
  port?: number;
  password?: string;
}

declare class Power {
  OFF: PowerState; // = 0;
  ON: PowerState; // = 1;
  COOLING_DOWN: PowerState; // = 2;
  WARMING_UP: PowerState; // = 3;
  STANDBY: PowerState; // = 0;
}

declare enum PowerState {
  OFF = 0,
  ON = 1,
  COOLING_DOWN = 2,
  WARMING_UP = 3,
  STANDBY = 0,
}

declare class InputValues {
  RGB; // = 1;
  VIDEO; // = 2;
  DIGITAL; // = 3;
  STORAGE; // = 4;
  NETWORK; // = 5;
}

declare interface Input {
  source: number | string;
  channel: number;
  code: string;
  name: string;
}

declare interface MuteState {
  audio: boolean;
  video: boolean;
}

declare interface PJLinkError {
  fan?: string;
  lamp?: string;
  temperature?: string;
  cover?: string;
  filter?: string;
  other?: string;
}

declare interface Lamp {
  hours: number;
  on: boolean;
}
