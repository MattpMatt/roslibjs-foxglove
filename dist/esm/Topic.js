export class Message {
  values;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(values) {
    this.values = values;
    Object.assign(this, values);
  }
}
export class Topic {
  options;
  #ros;
  #name;
  #messageType;
  #publisher;
  #subscriptions = new Map();
  constructor(options) {
    this.options = options;
    this.#ros = options.ros;
    this.#name = options.name;
    this.#messageType = options.messageType;
  }
  get name() {
    return this.#name;
  }
  get messageType() {
    return this.#messageType;
  }
  publish(message) {
    if (!this.#publisher) {
      this.advertise();
    }
    this.#publisher?.then((publisher) => {
      publisher.publish(message);
    });
  }
  subscribe(callback) {
    this.#ros.rosImpl
      ?.createSubscription(this.name, callback)
      .then((subscription) => {
        this.#subscriptions.set(callback, subscription);
      });
  }
  unsubscribe(callback) {
    if (callback) {
      this.#subscriptions.get(callback)?.unsubscribe();
      this.#subscriptions.delete(callback);
    } else {
      for (const subscription of this.#subscriptions.values()) {
        subscription.unsubscribe();
      }
      this.#subscriptions.clear();
    }
  }
  advertise() {
    this.#publisher = this.#ros.rosImpl?.createPublisher(
      this.name,
      this.messageType,
    );
  }
  unadvertise() {
    this.#publisher?.then((publisher) => {
      publisher.unadvertise();
      this.#publisher = undefined;
    });
  }
}
//# sourceMappingURL=Topic.js.map
