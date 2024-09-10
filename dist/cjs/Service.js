Object.defineProperty(exports, '__esModule', { value: true });
exports.Service = exports.ServiceRequest = void 0;
class ServiceRequest {
  values;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(values) {
    this.values = values;
    Object.assign(this, values);
  }
}
exports.ServiceRequest = ServiceRequest;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
class Service {
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
exports.Service = Service;
//# sourceMappingURL=Service.js.map
