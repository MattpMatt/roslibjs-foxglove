import type EventEmitter from 'eventemitter3';
import type { EventTypes } from './Impl';
export declare class Ros {
  #private;
  readonly options: {
    readonly url?: string;
  };
  constructor(options: {
    readonly url?: string;
  });
  on<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
  ): this;
  off<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
  ): this;
  connect(url: string): void;
  close(): void;
  getTopics(
    callback: (result: {
      topics: string[];
      types: string[];
    }) => void,
    failedCallback?: (error: string) => void,
  ): void;
  getServices(
    callback: (services: string[]) => void,
    failedCallback?: (error: string) => void,
  ): void;
  getTopicType(
    topic: string,
    callback: (type: string) => void,
    failedCallback?: (error: string) => void,
  ): void;
  getServiceType(
    service: string,
    callback: (type: string) => void,
    failedCallback?: (error: string) => void,
  ): void;
}
//# sourceMappingURL=Ros.d.ts.map
