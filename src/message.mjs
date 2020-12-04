import { hostname } from "os";
import uuid from "uuid-js";
import cloneDeep from "clone-deep";
import merge from "merge-light";

/**
 * Creates a new request message structure. It will merge the new data into a copy of the old request.
 * Only the fields 'info' and 'hops' will be copied
 * @param newData {object} This json is new generated data by the step. It has the follwing structure.
 *	                       newData : {
 *                           "info" : {},
 *                           "payload" :
 *                         }
 *
 * @param oldRequestMessage {object} The request message this step has received
 */
export function createMessage(newData, oldRequestMessage) {
  let newMessage = {};

  if (oldRequestMessage) {
    let infoCopy = cloneDeep(oldRequestMessage.info);
    let hopsCopy = cloneDeep(oldRequestMessage.hops);
    let newInfoCopy = cloneDeep(newData.info);

    newMessage = {
      info: infoCopy,
      hops: hopsCopy
    };

    merge(newMessage.info, newInfoCopy);
    newMessage.payload = newData.payload || {};
  } else if (newData) {
    let newInfoCopy = cloneDeep(newData.info);
    if (newData.hops) {
      newMessage.hops = cloneDeep(newData.hops);
    } else {
      newMessage.hops = [];
    }
    newMessage.info = newInfoCopy;
    newMessage.payload = newData.payload || {};
  } else {
    newMessage = {
      info: {},
      hops: [],
      payload: {}
    };
  }

  return newMessage;
}

/**
 * Adds a new way point to the message
 * @param message {object} The message to add the new hop
 * @param stepName {string} The name of the current step which issues this way point
 * @param stepType {string} The typeName of the step
 * @param endpoint {string} The name of endpoint the message is routed through
 */
export function addHop(message, stepName, stepType, endpoint) {
  message.hops.push({
    time: Date.now(),
    id: uuid.create(4).toString(),
    stepName: stepName,
    stepType: stepType,
    endpoint: endpoint,
    host: hostname()
  });
}
