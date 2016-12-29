// @flow

import type { EventPublisher } from 'spark-protocol';
import type { Event, EventData } from '../types';

type FilterOptions = {
  deviceID?: string,
  userID?: string,
};

class EventManager {
  _eventPublisher: EventPublisher;

  constructor(eventPublisher: EventPublisher) {
    this._eventPublisher = eventPublisher;
  }

  subscribe = (
    eventName: ?string,
    eventHandler: (event: Event) => void,
    filterOptions?: FilterOptions,
  ): string =>
    this._eventPublisher.subscribe(
      eventName,
      eventHandler,
      filterOptions,
    );

  unsubscribe = (subscriptionID: string): void =>
    this._eventPublisher.unsubscribe(subscriptionID);

  publish = (eventData: EventData): void =>
    this._eventPublisher.publish(eventData);
}

export default EventManager;
