import { Impl } from './Impl';
export class Ros {
  options;
  #rosImpl;
  constructor(options) {
    this.options = options;
    if (options.url) {
      this.connect(options.url);
    }
  }
  /** @internal */
  get rosImpl() {
    return this.#rosImpl;
  }
  on(event, fn) {
    this.rosImpl?.emitter.on(event, fn);
    return this;
  }
  off(event, fn) {
    this.rosImpl?.emitter.off(event, fn);
    return this;
  }
  connect(url) {
    this.#rosImpl = new Impl(url);
  }
  close() {
    this.rosImpl?.close();
    this.#rosImpl = undefined;
  }
  getTopics(callback, failedCallback) {
    const topics = this.rosImpl?.getTopics();
    if (topics) {
      callback(topics);
    } else if (failedCallback) {
      failedCallback('Error: getTopics');
    }
  }
  getServices(callback, failedCallback) {
    this.rosImpl?.getServices().then(callback).catch(failedCallback);
  }
  getTopicType(topic, callback, failedCallback) {
    const topicType = this.rosImpl?.getTopicType(topic);
    if (topicType) {
      callback(topicType);
    } else if (failedCallback) {
      failedCallback('Error: getTopicType');
    }
  }
  getServiceType(service, callback, failedCallback) {
    const serviceType = this.rosImpl?.getServiceType(service);
    if (serviceType) {
      callback(serviceType);
    } else if (failedCallback) {
      failedCallback('Error: getServiceType');
    }
  }
}
//# sourceMappingURL=Ros.js.map
