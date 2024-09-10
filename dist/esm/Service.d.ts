import type { Ros } from './Ros';
export declare class ServiceRequest {
  readonly values: any;
  constructor(values: any);
}
export declare class Service<TRequest = any, TResponse = any> {
  #private;
  readonly options: {
    readonly ros: Ros;
    readonly name: string;
    readonly serviceType: string;
  };
  constructor(options: {
    readonly ros: Ros;
    readonly name: string;
    readonly serviceType: string;
  });
  get name(): string;
  get serviceType(): string;
  callService(
    request: TRequest,
    callback: (response: TResponse) => void,
    failedCallback?: (error: string) => void,
  ): void;
}
//# sourceMappingURL=Service.d.ts.map
