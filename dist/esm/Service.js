export class ServiceRequest {
  values;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(values) {
    this.values = values;
    Object.assign(this, values);
  }
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export class Service {
  options;
  #ros;
  #name;
  #serviceType;
  constructor(options) {
    this.options = options;
    this.#ros = options.ros;
    this.#name = options.name;
    this.#serviceType = options.serviceType;
  }
  get name() {
    return this.#name;
  }
  get serviceType() {
    return this.#serviceType;
  }
  callService(request, callback, failedCallback) {
    this.#ros.rosImpl
      ?.sendServiceRequest(this.name, request)
      .then(callback)
      .catch(failedCallback);
  }
}
//# sourceMappingURL=Service.js.map
