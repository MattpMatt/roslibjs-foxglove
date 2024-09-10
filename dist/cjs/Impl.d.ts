import type { Parameter, ParameterValue } from '@foxglove/ws-protocol';
import type EventEmitter from 'eventemitter3';
export interface EventTypes {
  connection: () => void;
  close: (event: CloseEvent) => void;
  error: (error: Error) => void;
}
export interface Publisher<T> {
  publish: (message: T) => void;
  unadvertise: () => void;
}
export interface Subscription {
  unsubscribe: () => void;
}
export declare class Impl {
  #private;
  readonly emitter: EventEmitter<EventTypes, any>;
  constructor(url: string);
  close(): void;
  getTopics(): {
    topics: string[];
    types: string[];
  };
  getServices(): Promise<string[]>;
  getTopicType(topic: string): string | undefined;
  getServiceType(service: string): string | undefined;
  createPublisher<T>(name: string, messageType: string): Promise<Publisher<T>>;
  createSubscription<T>(
    name: string,
    callback: (message: T) => void,
  ): Promise<Subscription>;
  sendServiceRequest<Request, Response>(
    name: string,
    request: Request,
  ): Promise<Response>;
  getParameter(name: string): Promise<ParameterValue>;
  setParameter(
    name: string,
    value: ParameterValue,
    type?: 'byte_array' | 'float64' | 'float64_array',
  ): Promise<Parameter>;
}
//# sourceMappingURL=Impl.d.ts.map
