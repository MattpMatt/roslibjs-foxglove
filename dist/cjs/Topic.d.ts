import type { Ros } from './Ros';
export declare class Message {
  readonly values: any;
  constructor(values: any);
}
export declare class Topic<TMessage = Message> {
  #private;
  readonly options: {
    readonly ros: Ros;
    readonly name: string;
    readonly messageType: string;
  };
  constructor(options: {
    readonly ros: Ros;
    readonly name: string;
    readonly messageType: string;
  });
  get name(): string;
  get messageType(): string;
  publish(message: TMessage): void;
  subscribe(callback: (message: TMessage) => void): void;
  unsubscribe(callback?: (message: TMessage) => void): void;
  advertise(): void;
  unadvertise(): void;
}
//# sourceMappingURL=Topic.d.ts.map
