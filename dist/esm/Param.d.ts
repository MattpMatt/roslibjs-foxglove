import type { Parameter, ParameterValue } from '@foxglove/ws-protocol';
import type { Ros } from './Ros';
export declare class Param {
  #private;
  readonly options: {
    readonly ros: Ros;
    readonly name: string;
  };
  constructor(options: {
    readonly ros: Ros;
    readonly name: string;
  });
  get(callback: (value: ParameterValue) => void): void;
  set(
    value: ParameterValue,
    callback: (value: Parameter) => void,
    type?: 'byte_array' | 'float64' | 'float64_array',
  ): void;
}
//# sourceMappingURL=Param.d.ts.map
