/* jslint node: true, esnext: true */

"use strict";

const consul = require('consul')();
const Promise = require("Promise");


const rootService = {
  toString: function () {
    return this.name;
  },
  consulDefinition: function () {
    return {
      name: this.name,
      serviceid: this.serviceid,
      check: this.check,
      tags: this.tags,
      notes: this.notes
    };
  },
  register: function () {
    const service = this;
    return new Promise(function (resolve, reject) {
      consul.agent.service.register(service.consulDefinition(), function (error) {
        if (error) {
          console.log(`error registering: ${service} ${error}`);
          reject(error);
        } else {
          console.log(`registered: ${service}`);
          resolve(service);
        }
      });
    });
  },
  deregister: function () {
    const service = this;
    return new Promise(function (resolve, reject) {
      consul.agent.service.deregister(service.name, function (error) {
        if (error) {
          console.log(`error deregistering: ${service} ${error}`);
          reject(error);
        } else {
          console.log(`deregistered: ${service}`);
          resolve(service);
        }
      });
    });
  }
};


exports.service = function (options) {

  const name = options.name;
  const serviceid = options.serviceid |  name;
  const notes = options.notes;
  const tags = options.tags;
  const check = options.check;

  const properties = {
    name: {
      value: name
    },
    serviceid: {
      value: serviceid
    },
    check: {
      value: check
    },
    notes: {
      value: notes
    },
    tags: {
      value: tags
    }
  };

  const service = Object.create(rootService, properties);

  return service;
};

exports.consul = consul;
